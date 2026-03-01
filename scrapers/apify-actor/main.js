// Crown Deals Rolex Scraper - Apify Actor v2 (Puppeteer for JS-rendered sites)
const { Actor } = require('apify');
const { PuppeteerCrawler } = require('crawlee');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ROLEX_REFS = /(126\d{3}|116\d{3}|124\d{3}|228\d{3})/i;

async function scrapeEBay() {
  const results = [];
  
  const crawler = new PuppeteerCrawler({
    proxyConfiguration: await Actor.createProxyConfiguration(),
    maxRequestsPerCrawl: 10,
    
    async requestHandler({ request, page, log }) {
      log.info(`Loading eBay: ${request.url}`);
      
      // Wait for listings to load
      await page.waitForSelector('.s-item, [data-testid="listing-card"]', { timeout: 10000 });
      
      const listings = await page.evaluate(() => {
        const items = [];
        const selectors = ['.s-item', '[data-testid="listing-card"]', '.srp-results li'];
        
        for (const sel of selectors) {
          const elements = document.querySelectorAll(sel);
          if (elements.length > 2) {
            elements.forEach(el => {
              try {
                const titleEl = el.querySelector('.s-item__title span, .s-item__title, [data-testid="listing-card-title"]');
                const priceEl = el.querySelector('.s-item__price, [data-testid="price"]');
                const linkEl = el.querySelector('a.s-item__link, a[href*="/itm/"]');
                const imgEl = el.querySelector('.s-item__image-img');
                
                const title = titleEl?.textContent?.trim();
                const priceText = priceEl?.textContent?.trim();
                const price = priceText?.match(/[\d,]+\.?\d*/)?.[0]?.replace(/,/g, '');
                const url = linkEl?.href;
                const image = imgEl?.src || imgEl?.dataset?.src;
                const itemId = url?.match(/\/itm\/(\d+)/)?.[1];
                
                if (title && price && parseFloat(price) > 3000 && !title.includes('Shop on eBay')) {
                  items.push({
                    source: 'ebay',
                    source_id: itemId,
                    title: title.substring(0, 250),
                    price: parseFloat(price),
                    currency: priceText.includes('EUR') ? 'EUR' : 'USD',
                    condition: 'used',
                    url: url?.split('?')[0],
                    image_url: image,
                    scraped_at: new Date().toISOString()
                  });
                }
              } catch (e) {}
            });
            break;
          }
        }
        return items;
      });
      
      results.push(...listings);
      log.info(`Extracted ${listings.length} eBay listings`);
    }
  });
  
  await crawler.run(['https://www.ebay.com/sch/i.html?_nkw=rolex+submariner&_sacat=0&_sop=12']);
  return results;
}

async function scrapeChrono24() {
  const results = [];
  
  const crawler = new PuppeteerCrawler({
    proxyConfiguration: await Actor.createProxyConfiguration(),
    maxRequestsPerCrawl: 5,
    
    async requestHandler({ request, page, log }) {
      log.info(`Loading Chrono24: ${request.url}`);
      
      // Wait for content
      try {
        await page.waitForSelector('[data-article-id], .article-item-container', { timeout: 15000 });
      } catch (e) {
        log.warning('Timeout waiting for articles, taking screenshot...');
        await Actor.pushData({ error: 'load-timeout', url: request.url, screenshot: await page.screenshot() });
        return;
      }
      
      // Accept cookies if present
      const cookieBtn = await page.$('button[data-testid="cookie-banner-btn-accept"], .cf-cookie-accept');
      if (cookieBtn) await cookieBtn.click();
      
      const listings = await page.evaluate(() => {
        const items = [];
        const articles = document.querySelectorAll('[data-article-id], .article-item-container');
        
        articles.forEach(el => {
          try {
            const articleId = el.getAttribute('data-article-id') || el.closest('[data-article-id]')?.getAttribute('data-article-id');
            const title = el.querySelector('.h3, h3, .article-title')?.textContent?.trim();
            const priceEl = el.querySelector('[data-currency], .price, .amount');
            const priceText = priceEl?.textContent?.trim() || '';
            const price = priceText.match(/[\d,]+/)?.[0]?.replace(/,/g, '');
            const currency = priceText.includes('€') ? 'EUR' : 'USD';
            const link = el.querySelector('a[href*="/listing/"]')?.href;
            
            if (title && price && parseInt(price) > 2000) {
              items.push({
                source: 'chrono24',
                source_id: articleId,
                title: title.substring(0, 250),
                price: parseInt(price),
                currency,
                condition: 'used',
                url: link,
                scraped_at: new Date().toISOString()
              });
            }
          } catch (e) {}
        });
        
        return items;
      });
      
      results.push(...listings);
      log.info(`Extracted ${listings.length} Chrono24 listings`);
    }
  });
  
  await crawler.run(['https://www.chrono24.com/rolex/index.htm']);
  return results;
}

async function saveToSupabase(listings) {
  const results = { inserted: 0, errors: [] };
  
  if (!listings.length) return results;
  
  // Get products for matching
  const { data: products } = await supabase.from('products').select('id,ref_number');
  const refMap = new Map(products?.map(p => [p.ref_number, p.id]) || []);
  
  for (const listing of listings) {
    try {
      const refMatch = listing.title.match(ROLEX_REFS);
      const productId = refMatch && refMap.has(refMatch[1]) ? refMap.get(refMatch[1]) : null;
      
      const { error } = await supabase.from('listings').upsert({
        ...listing,
        product_id: productId
      }, { onConflict: 'source_id' });
      
      if (error) results.errors.push({ title: listing.title, error: error.message });
      else results.inserted++;
    } catch (e) {
      results.errors.push({ title: listing.title, error: e.message });
    }
  }
  
  return results;
}

Actor.main(async () => {
  console.log('🏁 Crown Deals Scraper v2\n');
  
  const input = await Actor.getInput();
  const source = input?.source || 'chrono24';
  
  let allResults = [];
  
  if (source === 'chrono24' || source === 'all') {
    console.log('⏱️ Scraping Chrono24...');
    const chrono = await scrapeChrono24();
    console.log(`✅ Chrono24: ${chrono.length} listings`);
    allResults.push(...chrono);
  }
  
  if (source === 'ebay' || source === 'all') {
    console.log('📦 Scraping eBay...');
    const ebay = await scrapeEBay();
    console.log(`✅ eBay: ${ebay.length} listings`);
    allResults.push(...ebay);
  }
  
  console.log('\n💾 Saving to Supabase...');
  const saved = await saveToSupabase(allResults);
  console.log(`✅ Inserted: ${saved.inserted}, Errors: ${saved.errors.length}`);
  
  await Actor.pushData({ 
    total: allResults.length, 
    inserted: saved.inserted,
    sample: allResults.slice(0, 3)
  });
  
  console.log('\n🎉 Done!');
});