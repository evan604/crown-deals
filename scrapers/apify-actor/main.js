// Crown Deals Rolex Scraper - Apify Actor v2.6 (Playwright)
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
      
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Extract all listings in one page.evaluate
      const listings = await page.evaluate(() => {
        const items = [];
        
        // Find all article containers
        const articles = document.querySelectorAll('.article-item-container');
        
        articles.forEach((article, idx) => {
          try {
            // Get all text content and split by lines
            const text = article.innerText || '';
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            // First non-empty line is usually the title
            let title = lines[0] || '';
            
            // Skip if it's just navigation text or not a watch
            const skipWords = ['Go to slide', 'Popular', 'Promoted', 'NE', 'Bl', 'Wa', 'Li', 'Fa', 'Like N', 'NEW'];
            if (skipWords.some(w => title.toLowerCase().startsWith(w.toLowerCase())) || title.length < 5) {
              // Try next line
              for (let i = 1; i < lines.length; i++) {
                if (!skipWords.some(w => lines[i].toLowerCase().startsWith(w.toLowerCase())) && lines[i].length > 5) {
                  title = lines[i];
                  break;
                }
              }
            }
            
            // If title is still bad, skip this article
            if (!title || title.length < 5 || skipWords.some(w => title.toLowerCase().startsWith(w.toLowerCase()))) {
              return;
            }
            
            // Look for price in any line
            let price = null;
            let currency = 'USD';
            
            for (const line of lines) {
              // Match prices like $20,999 or €15,500 or £12,000
              const priceMatch = line.match(/[$€£]([\d,]+)/);
              if (priceMatch) {
                price = parseInt(priceMatch[1].replace(/,/g, ''));
                if (line.includes('€')) currency = 'EUR';
                else if (line.includes('£')) currency = 'GBP';
                else if (line.includes('$')) currency = 'USD';
                break;
              }
            }
            
            // Get link
            const linkEl = article.querySelector('a[href*="/listing/"]') || 
                          article.querySelector('a');
            const url = linkEl?.href || '';
            
            // Get ID from data attribute or URL
            const dataId = article.getAttribute('data-article-id');
            const urlId = url.match(/\/(\d+)\?/)?.[1];
            const sourceId = dataId || urlId || `item-${idx}`;
            
            items.push({
              source: 'chrono24',
              source_id: String(sourceId),
              title,
              price: price || 0,
              currency,
              url,
              raw_lines: lines.slice(0, 5) // Debug: first 5 lines
            });
          } catch (e) {
            console.log(`Error: ${e.message}`);
          }
        });
        
        return items;
      });
      
      log.info(`Extracted ${listings.length} listings`);
      
      // Show sample
      if (listings.length > 0) {
        log.info(`Sample: ${listings[0].title} - $${listings[0].price}`);
      }
      
      results.push(...listings);
      
      // Push to dataset with debug info
      await Actor.pushData(listings);
    }
  });
  
  await crawler.run(['https://www.chrono24.com/rolex/index.htm']);
  return results;
}

Actor.main(async () => {
  console.log('🏁 Starting Crown Deals Scraper v2.6');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
  
  const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;
  
  const listings = await scrapeChrono24(supabase);
  console.log(`✅ Scraped: ${listings.length} listings`);
  
  // Save to Supabase
  let inserted = 0;
  if (supabase && listings.length > 0) {
    for (const l of listings) {
      delete l.raw_lines; // Remove debug field before saving
      const { error } = await supabase.from('listings').upsert({
        ...l,
        condition: 'used',
        scraped_at: new Date().toISOString()
      }, { onConflict: 'source_id' });
      if (!error) inserted++;
    }
    console.log(`💾 Saved: ${inserted} to database`);
  }
  
  await Actor.pushData({ 
    summary: true,
    total: listings.length, 
    inserted,
    scraper_version: '2.6'
  });
  
  console.log('🏁 Done');
});
