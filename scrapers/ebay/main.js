// Crown Deals eBay Rolex Scraper - Apify Actor v1.0
const { Actor } = require('apify');
const { PlaywrightCrawler } = require('crawlee');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// Search URLs for different Rolex models
const SEARCH_URLS = [
  'https://www.ebay.com/sch/i.html?_nkw=rolex+submariner&_sacat=0&_sop=10',
  'https://www.ebay.com/sch/i.html?_nkw=rolex+daytona&_sacat=0&_sop=10',
  'https://www.ebay.com/sch/i.html?_nkw=rolex+datejust&_sacat=0&_sop=10',
  'https://www.ebay.com/sch/i.html?_nkw=rolex+gmt-master&_sacat=0&_sop=10',
  'https://www.ebay.com/sch/i.html?_nkw=rolex+yacht-master&_sacat=0&_sop=10',
];

async function scrapeEbay() {
  const results = [];
  
  const crawler = new PlaywrightCrawler({
    proxyConfiguration: await Actor.createProxyConfiguration(),
    maxRequestsPerCrawl: 10,
    maxConcurrency: 2,
    
    async requestHandler({ request, page, log }) {
      log.info(`Loading: ${request.url}`);
      
      // Wait for listings to load
      await page.waitForSelector('[data-testid="listing-item"], .s-item, [data-view="browseCarouselEntry"]', 
        { timeout: 15000 }).catch(() => {});
      
      // Accept cookies if present
      const cookieBtn = await page.$('#gdpr-banner-accept').catch(() => null);
      if (cookieBtn) await cookieBtn.click().catch(() => {});
      
      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);
      
      const listings = await page.evaluate(() => {
        const items = [];
        
        // Try multiple selectors for eBay's varying layouts
        const selectors = [
          '[data-testid="listing-item"]',
          '.s-item',
          '.srp-results .s-item__wrapper',
          '[data-view="browseResultsRow"] .s-item'
        ];
        
        for (const selector of selectors) {
          document.querySelectorAll(selector).forEach(el => {
            try {
              // Skip ad/promo items
              if (el.textContent.includes('Sponsored') || 
                  el.querySelector('.s-item__title')?.textContent?.includes('Shop on eBay')) {
                return;
              }
              
              const titleEl = el.querySelector('.s-item__title, h3 a, .s-item__title--has-tags');
              const title = titleEl?.textContent?.trim();
              
              const priceEl = el.querySelector('.s-item__price, .notranslate');
              const priceText = priceEl?.textContent?.trim() || '';
              
              // Extract numeric price
              const priceMatch = priceText.match(/\$?([\d,]+(?:\.\d{2})?)/);
              const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;
              
              // Skip if no price or price is 0
              if (!price || price === 0) return;
              
              const url = titleEl?.href || el.querySelector('a')?.href;
              const itemId = url?.match(/\/(\d+)\?/)?.[1] || 
                            el.getAttribute('data-item-id') ||
                            Math.random().toString(36).substring(2);
              
              // Get condition
              const condEl = el.querySelector('.s-item__subtitle, .s-item__condition');
              const condition = condEl?.textContent?.trim() || 'unknown';
              
              // Get shipping info
              const shipEl = el.querySelector('.s-item__shipping, .s-item__logisticsCost');
              const shipping = shipEl?.textContent?.trim() || '';
              
              if (title && price && url) {
                items.push({
                  source: 'ebay',
                  source_id: `ebay_${itemId}`,
                  title,
                  price,
                  price_currency: 'USD',
                  url,
                  condition,
                  shipping_info: shipping,
                  category: url.toLowerCase().includes('submariner') ? 'Submariner' : 
                           url.toLowerCase().includes('daytona') ? 'Daytona' :
                           url.toLowerCase().includes('datejust') ? 'Datejust' :
                           url.toLowerCase().includes('gmt') ? 'GMT-Master' :
                           url.toLowerCase().includes('yacht') ? 'Yacht-Master' : 'Other'
                });
              }
            } catch (e) {}
          });
        }
        
        return items;
      });
      
      results.push(...listings);
      log.info(`Found ${listings.length} items`);
      
      // Pagination
      const nextBtn = await page.$('.pagination__next, .srp-pagination .next, a[rel="next"]').catch(() => null);
      if (nextBtn) {
        const hasMore = await nextBtn.evaluate(el => !el.disabled && !el.classList.contains('disabled'));
        if (hasMore && results.length < 200) {
          const nextUrl = await nextBtn.evaluate(el => el.href).catch(() => null);
          if (nextUrl) {
            await crawler.addRequests([nextUrl]);
          }
        }
      }
    },
    
    async failedRequestHandler({ request, log }) {
      log.error(`Failed to load: ${request.url}`);
    }
  });
  
  await crawler.run(SEARCH_URLS);
  return results;
}

Actor.main(async () => {
  console.log('🏁 Starting eBay Rolex scraper...');
  const listings = await scrapeEbay();
  console.log(`✅ Scraped: ${listings.length} items`);
  
  // Save to Supabase if configured
  let inserted = 0;
  if (process.env.SUPABASE_URL) {
    for (const l of listings) {
      const { error } = await supabase.from('listings').upsert({
        ...l,
        scraped_at: new Date().toISOString(),
        processed: false
      }, { onConflict: 'source_id' });
      
      if (!error) inserted++;
      else console.error('Insert error:', error.message);
    }
    console.log(`💾 Saved: ${inserted} to Supabase`);
  } else {
    console.log('⚠️ SUPABASE_URL not set, skipping DB save');
  }
  
  await Actor.pushData({ total: listings.length, inserted, source: 'ebay' });
});
