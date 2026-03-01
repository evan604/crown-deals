// Crown Deals Rolex Scraper - Apify Actor v2.4 (Playwright)
const { Actor } = require('apify');
const { PlaywrightCrawler } = require('crawlee');
const { createClient } = require('@supabase/supabase-js');

async function scrapeChrono24(supabase) {
  const results = [];
  
  const crawler = new PlaywrightCrawler({
    proxyConfiguration: await Actor.createProxyConfiguration(),
    maxRequestsPerCrawl: 5,
    headless: false, // Run headed to avoid bot detection
    
    async requestHandler({ request, page, log }) {
      log.info(`Loading: ${request.url}`);
      
      // Wait for initial load
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      log.info('Page network idle');
      
      // Handle cookie banner if present
      const cookieSelectors = [
        '[data-testid="cookie-banner-btn-accept"]',
        'button:has-text("Accept")',
        'button:has-text("Agree")',
        '#onetrust-accept-btn-handler',
        '.ot-pc-refuse-all-handler',
        'button.cookie-accept-all'
      ];
      
      for (const selector of cookieSelectors) {
        try {
          const btn = await page.$(selector);
          if (btn) {
            await btn.click().catch(() => {});
            log.info(`Clicked cookie: ${selector}`);
            await page.waitForTimeout(1000);
            break;
          }
        } catch (e) {}
      }
      
      // Try multiple possible article selectors
      const articleSelectors = [
        '.article-item-container',
        '.article-item',
        '[data-article-id]',
        'article[data-testid]',
        '.product-item',
        '.listing-item',
        '.article'
      ];
      
      let selectorThatWorked = null;
      let articles = [];
      
      for (let i = 0; i < 5; i++) {
        for (const selector of articleSelectors) {
          articles = await page.$$(selector);
          if (articles.length > 0) {
            selectorThatWorked = selector;
            log.info(`Found ${articles.length} articles with selector: ${selector}`);
            break;
          }
        }
        if (articles.length > 0) break;
        
        // Scroll to load more if needed
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(2000);
      }
      
      if (articles.length === 0) {
        log.warning('No articles found after scrolling. Taking screenshot for debug.');
        // Save debug screenshot
        await Actor.setValue('debug-screenshot', await page.screenshot({ type: 'png' }), { contentType: 'image/png' });
        // Save page HTML for debugging
        const html = await page.content();
        await Actor.setValue('debug-html', html, { contentType: 'text/html' });
        log.warning('Saved debug screenshot and HTML to key-value store');
        return;
      }
      
      // Extract data
      const listings = await page.evaluate((selector) => {
        const items = [];
        document.querySelectorAll(selector).forEach((el, idx) => {
          try {
            // Try multiple title selectors
            const titleSelectors = ['.article-title', '.product-title', 'h3', 'h2', '.h3', '[data-testid="title"]'];
            let title = '';
            for (const ts of titleSelectors) {
              const elTitle = el.querySelector(ts);
              if (elTitle) {
                title = elTitle.textContent.trim();
                break;
              }
            }
            
            // Try multiple price selectors
            const priceSelectors = ['[data-currency]', '.price', '.amount', '[data-price]', '.product-price'];
            let priceText = '';
            for (const ps of priceSelectors) {
              const elPrice = el.querySelector(ps);
              if (elPrice) {
                priceText = elPrice.textContent.trim();
                break;
              }
            }
            
            // Extract price number
            const priceMatch = priceText.match(/[\d,\.]+/);
            const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : null;
            
            // Determine currency
            const currency = priceText.includes('€') ? 'EUR' : 
                           priceText.includes('$') ? 'USD' : 
                           priceText.includes('£') ? 'GBP' : 'USD';
            
            // Try multiple link selectors
            const linkSelectors = ['a[href*="/listing/"]', 'a[href*="/watches/"]', 'a'];
            let url = '';
            for (const ls of linkSelectors) {
              const elLink = el.querySelector(ls);
              if (elLink?.href) {
                url = elLink.href;
                break;
              }
            }
            
            // Get ID - try data attributes or fallback to index
            const id = el.getAttribute('data-article-id') || 
                      el.getAttribute('data-id') || 
                      el.getAttribute('id') || 
                      `item-${idx}`;
            
            if (title && price) {
              items.push({ 
                source: 'chrono24', 
                source_id: String(id), 
                title, 
                price, 
                currency, 
                url: url || window.location.href
              });
            }
          } catch (e) {
            console.log(`Error parsing item ${idx}:`, e.message);
          }
        });
        return items;
      }, selectorThatWorked);
      
      results.push(...listings);
      log.info(`Found ${listings.length} items`);
      
      // Save extracted data for debugging
      await Actor.pushData(listings);
    }
  });
  
  await crawler.run(['https://www.chrono24.com/rolex/index.htm']);
  return results;
}

Actor.main(async () => {
  console.log('🏁 Starting Crown Deals Scraper v2.4');
  
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
    total: listings.length, 
    inserted,
    scraper_version: '2.4'
  });
  
  console.log('🏁 Done');
});
