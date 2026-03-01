// Crown Deals Rolex Scraper - Apify Actor
const { Actor } = require('apify');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// eBay scraper
async function scrapeEbay(input) {
  const { Search } = input;
  const results = [];
  
  const searches = Search?.queries || ['rolex submariner', 'rolex gmt', 'rolex daytona'];
  
  for (const query of searches.slice(0, 3)) {
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&_from=R40&_sop=12&LH_Complete=1&rt=nc`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const html = await response.text();
    
    // Extract listings using regex (simple approach)
    const listingMatches = html.match(/data-testid="listing-card"[\s\S]*?<\/li>/g) || [];
    
    for (const listing of listingMatches.slice(0, 10)) {
      const titleMatch = listing.match(/s-item__title[^>]*>([^<]+)/);
      const priceMatch = listing.match(/s-item__price[^>]*>([^<]+)/);
      const linkMatch = listing.match(/href="([^"]+)"/);
      
      if (titleMatch && priceMatch) {
        const priceText = priceMatch[1].replace(/[^\d.]/g, '');
        const price = parseFloat(priceText);
        
        results.push({
          source: 'ebay',
          title: titleMatch[1].trim(),
          price: price,
          currency: priceMatch[1].includes('EUR') ? 'EUR' : 'USD',
          condition: 'used',
          url: linkMatch ? linkMatch[1] : null,
          scraped_at: new Date().toISOString()
        });
      }
    }
  }
  
  return results;
}

// Chrono24 scraper (model pages)
async function scrapeChrono24(input) {
  const models = input?.models || [
    'https://www.chrono24.com/rolex/submariner--mod126610.htm',
    'https://www.chrono24.com/rolex/gmtmaster--mod126710.htm'
  ];
  
  const results = [];
  
  for (const modelUrl of models.slice(0, 2)) {
    const response = await fetch(modelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    const html = await response.text();
    
    // Extract JSON-LD if present
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        if (data['@type'] === 'Product' && data.offers) {
          results.push({
            source: 'chrono24',
            title: data.name,
            price: data.offers.price,
            currency: data.offers.priceCurrency || 'USD',
            condition: 'used',
            url: data.url,
            image_url: data.image,
            scraped_at: new Date().toISOString()
          });
        }
      } catch (e) {
        // Fallback to regex extraction
      }
    }
    
    // Extract article items
    const itemMatches = html.match(/article-item-container[^>]*data-article-id="(\d+)"[^>]*>/g) || [];
    
    for (const itemHtml of itemMatches.slice(0, 15)) {
      const idMatch = itemHtml.match(/data-article-id="(\d+)"/);
      const id = idMatch ? idMatch[1] : null;
      
      if (id) {
        // Extract from surrounding context
        const fullItem = html.substring(
          html.indexOf(itemHtml),
          html.indexOf(itemHtml) + 3000
        );
        
        const titleMatch = fullItem.match(/class="h3"[^>]*>([^<]+)/);
        const priceMatch = fullItem.match(/data-currency[^>]*>([^<]+)/);
        
        if (titleMatch && priceMatch) {
          const priceText = priceMatch[1].replace(/[^\d]/g, '');
          const price = parseInt(priceText);
          
          results.push({
            source: 'chrono24',
            source_id: id,
            title: titleMatch[1].trim(),
            price: price,
            currency: 'EUR',
            condition: fullItem.toLowerCase().includes('unworn') ? 'unworn' : 'used',
            url: `https://www.chrono24.com/listing/${id}.htm`,
            scraped_at: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return results;
}

// Normalize and save to Supabase
async function saveToSupabase(listings) {
  if (!supabase) {
    console.log('Supabase not configured, skipping save');
    return { inserted: 0, errors: [] };
  }
  
  const normalized = listings.map(l => ({
    source: l.source,
    source_id: l.source_id || null,
    title: l.title,
    price: l.price,
    currency: l.currency || 'USD',
    condition: l.condition,
    has_box: l.has_box || false,
    has_papers: l.has_papers || false,
    seller_name: l.seller_name || null,
    seller_rating: l.seller_rating || null,
    url: l.url,
    image_url: l.image_url || null,
    scraped_at: l.scraped_at || new Date().toISOString()
  }));
  
  const results = { inserted: 0, errors: [] };
  
  for (const listing of normalized) {
    try {
      const { error } = await supabase
        .from('listings')
        .upsert(listing, { onConflict: 'source_id' });
      
      if (error) {
        results.errors.push({ listing: listing.title, error: error.message });
      } else {
        results.inserted++;
      }
    } catch (e) {
      results.errors.push({ listing: listing.title, error: e.message });
    }
  }
  
  return results;
}

Actor.main(async () => {
  console.log('🏁 Starting Crown Deals scraper...');
  
  const input = await Actor.getInput();
  const source = input?.source || 'all';
  
  let allResults = [];
  
  if (source === 'ebay' || source === 'all') {
    console.log('📦 Scraping eBay...');
    const ebayResults = await scrapeEbay(input);
    allResults = allResults.concat(ebayResults);
    console.log(`✅ eBay: ${ebayResults.length} listings`);
  }
  
  if (source === 'chrono24' || source === 'all') {
    console.log('⏱️ Scraping Chrono24...');
    const chronoResults = await scrapeChrono24(input);
    allResults = allResults.concat(chronoResults);
    console.log(`✅ Chrono24: ${chronoResults.length} listings`);
  }
  
  // Save to Supabase
  console.log('💾 Saving to Supabase...');
  const saveResults = await saveToSupabase(allResults);
  console.log(`✅ Inserted: ${saveResults.inserted}, Errors: ${saveResults.errors.length}`);
  
  // Push results to dataset
  await Actor.pushData({
    total_scraped: allResults.length,
    inserted: saveResults.inserted,
    errors: saveResults.errors,
    sample: allResults.slice(0, 5)
  });
  
  console.log('🎉 Done!');
});