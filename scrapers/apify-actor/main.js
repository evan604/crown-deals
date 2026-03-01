// Crown Deals Rolex Scraper - Apify Actor v2.5 (Playwright)
const { Actor } = require('apify');
const { PlaywrightCrawler } = require('crawlee');
const { createClient } = require('@supabase/supabase-js');

async function scrapeChrono24(supabase) {
  const results = [];
  
  const crawler = new PlaywrightCrawler({
    proxyConfiguration: await Actor.createProxyConfiguration(),
    maxRequestsPerCrawl: 5,
    headless: false,
    
    async requestHandler({ request, page, log }) {
      log.info(`Loading: ${request.url}`);
      
      // Wait for initial load
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      log.info('Page network idle');
      
      // Wait a bit for any dynamic content
      await page.waitForTimeout(3000);
      
      // Try to find articles
      const articleSelector = '.article-item-container';
      const articles = await page.$$(articleSelector);
      log.info(`Found ${articles.length} articles`);
      
      if (articles.length === 0) {
        log.warning('No articles found, saving debug screenshot');
        await Actor.setValue('debug-screenshot', await page.screenshot({ type: 'png' }), { contentType: 'image/png' });
        await Actor.setValue('debug-html', await page.content(), { contentType: 'text/html' });
        return;
      }
      
      // Save first article HTML for debugging
      const firstArticleHTML = await articles[0].evaluate(el => el.outerHTML);
      await Actor.setValue('debug-article-html', firstArticleHTML.substring(0, 5000), { contentType: 'text/plain' });
      log.info('Saved first article HTML to debug-article-html');
      
      // Extract data from each article
      for (const article of articles) {
        try {
          // Get all text content first
          const elementData = await article.evaluate((el) => {
            const data = {
              id: el.getAttribute('data-article-id') || el.getAttribute('data-id') || '',
              allText: el.innerText.substring(0, 500), // First 500 chars of text
              href: el.querySelector('a')?.href || '',
              links: Array.from(el.querySelectorAll('a')).map(a => ({href: a.href, text: a.innerText})).slice(0, 5)
            };
            
            // Try to find title
            const titleEl = el.querySelector('.article-title, .product-title, h3, h2, .h3, [data-testid="title"], .title');
            data.title = titleEl?.innerText?.trim() || '';
            
            // Try to find price
            const priceEl = el.querySelector('[data-currency], .price, .amount, [data-price], .product-price, .price-value');
            data.priceText = priceEl?.innerText?.trim() || '';
            
            // Try to find image
            const imgEl = el.querySelector('img');
            data.imageUrl = imgEl?.src || '';
            
            return data;
          });
          
          log.debug(`Article data: ${JSON.stringify(elementData)}`);
          
          // Parse price
          const priceMatch = elementData.priceText.match(/[\d,\.]+/);
          const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : null;
          
          const currency = elementData.priceText.includes('€') ? 'EUR' : 
                          elementData.priceText.includes('$') ? 'USD' : 
                          elementData.priceText.includes('£') ? 'GBP' : 'USD';
          
          // Determine source ID
          const sourceId = elementData.id || 
                          elementData.links[0]?.href?.match(/\d+/)?.[0] || 
                          `item-${results.length}`;
          
          // Build listing object with whatever we found
          const listing = {
            source: 'chrono24',
            source_id: String(sourceId),
            title: elementData.title || 'Unknown Watch',
            price: price || 0,
            currency,
            url: elementData.href || elementData.links[0]?.href || '',
            image_url: elementData.imageUrl,
            raw_text: elementData.allText.substring(0, 200) // Debug info
          };
          
          // Only add if we have a title
          if (listing.title && listing.title !== 'Unknown Watch') {
            results.push(listing);
            log.info(`Extracted: ${listing.title} - ${listing.price} ${listing.currency}`);
          } else {
            log.warning(`Skipping article - no title found. Sample text: ${elementData.allText.substring(0, 100)}`);
          }
        } catch (e) {
          log.error(`Error extracting article: ${e.message}`);
        }
      }
      
      log.info(`Total extracted: ${results.length} items`);
    }
  });
  
  await crawler.run(['https://www.chrono24.com/rolex/index.htm']);
  return results;
}

Actor.main(async () => {
  console.log('🏁 Starting Crown Deals Scraper v2.5');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE not set. Skipping database save.');
  }
  
  const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;
  
  const listings = await scrapeChrono24(supabase);
  console.log(`✅ Scraped: ${listings.length} listings`);
  
  // Push to Apify dataset
  if (listings.length > 0) {
    await Actor.pushData(listings);
  }
  
  // Save to Supabase
  let inserted = 0;
  if (supabase && listings.length > 0) {
    for (const l of listings) {
      const { error } = await supabase.from('listings').upsert({
        ...l,
        condition: 'used',
        scraped_at: new Date().toISOString()
      }, { onConflict: 'source_id' });
      if (!error) inserted++;
      else console.error(`Supabase error: ${error.message}`);
    }
    console.log(`💾 Saved: ${inserted} to database`);
  }
  
  await Actor.pushData({ 
    summary: true,
    total: listings.length, 
    inserted,
    scraper_version: '2.5'
  });
  
  console.log('🏁 Done');
});
