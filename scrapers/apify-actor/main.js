// Crown Deals Rolex Scraper - Apify Actor v2.2 (Playwright)
const { Actor } = require('apify');
const { PlaywrightCrawler } = require('crawlee');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function scrapeChrono24() {
  const results = [];
  
  const crawler = new PlaywrightCrawler({
    proxyConfiguration: await Actor.createProxyConfiguration(),
    maxRequestsPerCrawl: 5,
    
    async requestHandler({ request, page, log }) {
      log.info(`Loading: ${request.url}`);
      
      // Wait for articles to load
      await page.waitForSelector('[data-article-id], .article-item-container', { timeout: 15000 });
      
      // Accept cookies if present
      const cookieBtn = await page.$('[data-testid="cookie-banner-btn-accept"]');
      if (cookieBtn) await cookieBtn.click().catch(() => {});
      
      const listings = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('[data-article-id], .article-item-container').forEach(el => {
          try {
            const id = el.getAttribute('data-article-id');
            const title = el.querySelector('.h3, h3, .article-title')?.textContent?.trim();
            const priceText = el.querySelector('[data-currency], .price, .amount')?.textContent?.trim() || '';
            const price = priceText.match(/[\d,]+/)?.[0]?.replace(/,/g, '');
            const currency = priceText.includes('€') ? 'EUR' : 'USD';
            const url = el.querySelector('a[href*="/listing/"]')?.href;
            
            if (title && price) {
              items.push({ source: 'chrono24', source_id: id, title, price: parseInt(price), currency, url });
            }
          } catch (e) {}
        });
        return items;
      });
      
      results.push(...listings);
      log.info(`Found ${listings.length} items`);
    }
  });
  
  await crawler.run(['https://www.chrono24.com/rolex/index.htm']);
  return results;
}

Actor.main(async () => {
  console.log('🏁 Starting...');
  const listings = await scrapeChrono24();
  console.log(`✅ Scraped: ${listings.length}`);
  
  // Save to Supabase
  let inserted = 0;
  for (const l of listings) {
    const { error } = await supabase.from('listings').upsert({
      ...l,
      condition: 'used',
      scraped_at: new Date().toISOString()
    }, { onConflict: 'source_id' });
    if (!error) inserted++;
  }
  
  console.log(`💾 Saved: ${inserted}`);
  await Actor.pushData({ total: listings.length, inserted });
});