// Crown Deals Rolex Scraper - Apify Actor v2
const { Actor } = require('apify');
const { CheerioCrawler } = require('crawlee');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Rolex reference patterns to extract from titles
const ROLEX_REFS = /(126\d{3}|116\d{3}|124\d{3}|228\d{3}|126\d{2}|116\d{2})/i;

async function scrapeEBay() {
    const results = [];

    const crawler = new CheerioCrawler({
        proxyConfiguration: await Actor.createProxyConfiguration(),
        maxRequestsPerMinute: 60,

        async requestHandler({ request, $, log }) {
            log.info(`Processing eBay: ${request.url}`);

            // eBay listing selectors (they change frequently)
            let items = $('.s-item');
            if (items.length === 0) items = $('[data-testid="listing-card"]');
            if (items.length === 0) items = $('.srp-results li');

            log.info(`Found ${items.length} items`);

            items.each((i, el) => {
                try {
                    const $item = $(el);

                    // Skip ad/sponsored items
                    const isAd = $item.find('.s-item__title--has-sponsored-marker').length > 0;
                    if (isAd) return;

                    // Title
                    const title = $item.find('.s-item__title span, .s-item__title').first().text().trim();
                    if (!title || title.includes('Shop on eBay') || title.includes('Sponsored')) return;

                    // Price
                    const priceText = $item.find('.s-item__price').first().text().trim();
                    const priceMatch = priceText.match(/[\d,]+\.?\d*/);
                    const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
                    if (!price || price < 3000) return;

                    // Currency
                    const currency = priceText.includes('EUR') || priceText.includes('€') ? 'EUR' : 'USD';

                    // Condition
                    const conditionText = $item.find('.s-item__subtitle, .SECONDARY_INFO').text().toLowerCase();
                    let condition = 'used';
                    if (conditionText.includes('new') || conditionText.includes('unworn')) condition = 'unworn';
                    else if (conditionText.includes('pre-owned')) condition = 'pre_owned';

                    // URL
                    const link = $item.find('a.s-item__link').attr('href');
                    const itemId = link?.match(/\/itm\/(\d+)/)?.[1];
                    const url = link ? (link.startsWith('http') ? link : `https://www.ebay.com${link}`) : null;

                    // Image
                    const image = $item.find('.s-item__image-img').attr('src') ||
                        $item.find('.s-item__image-img').attr('data-src');

                    // Extract reference from title
                    const refMatch = title.match(ROLEX_REFS);

                    results.push({
                        source: 'ebay',
                        source_id: itemId,
                        title: title.substring(0, 250),
                        price,
                        currency,
                        condition,
                        url,
                        image_url: image,
                        scraped_at: new Date().toISOString()
                    });

                } catch (err) {
                    log.warning(`Error parsing eBay item: ${err.message}`);
                }
            });
        }
    });

    const searches = [
        'rolex submariner',
        'rolex gmt master',
        'rolex daytona',
        'rolex datejust'
    ];

    const startUrls = searches.map(q => ({
        url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&_sacat=0&_sop=12&rt=nc`,
        userData: { label: 'ebay' }
    }));

    await crawler.run(startUrls);
    return results;
}

async function scrapeChrono24() {
    const results = [];

    const crawler = new CheerioCrawler({
        proxyConfiguration: await Actor.createProxyConfiguration(),
        maxRequestsPerMinute: 30,

        async requestHandler({ request, $, log }) {
            log.info(`Processing Chrono24: ${request.url}`);

            // Article items
            const items = $('.article-item-container, [data-article-id]');
            log.info(`Found ${items.length} items`);

            items.each((i, el) => {
                try {
                    const $item = $(el);

                    const articleId = $item.attr('data-article-id') ||
                        $item.closest('[data-article-id]').attr('data-article-id');

                    // Title
                    const title = $item.find('.h3, h3, .article-title').first().text().trim();
                    if (!title) return;

                    // Price - Chrono24 stores in data attributes
                    const priceElem = $item.find('[data-currency], .price');
                    const priceText = priceElem.text().trim();
                    const priceMatch = priceText.match(/[\d,]+/);
                    const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : null;
                    const currency = priceText.includes('€') ? 'EUR' : 'USD';

                    if (!price || price < 2000) return;

                    // Condition
                    const condText = $item.find('.condition-label').text().toLowerCase();
                    const condition = condText.includes('unworn') ? 'unworn' :
                        condText.includes('excellent') ? 'excellent' :
                            condText.includes('very good') ? 'very_good' : 'used';

                    const hasBox = condText.includes('box') || condText.includes('komplett');
                    const hasPapers = condText.includes('papers') || condText.includes('ausweis');

                    // Seller
                    const sellerName = $item.find('.professional-name, .dealer-name').first().text().trim() || 'private';

                    // URL
                    const link = $item.find('a[href*="/listing/"]').first().attr('href');
                    const url = link ? (link.startsWith('http') ? link : `https://www.chrono24.com${link}`) : null;

                    results.push({
                        source: 'chrono24',
                        source_id: articleId,
                        title: title.substring(0, 250),
                        price,
                        currency,
                        condition,
                        has_box: hasBox,
                        has_papers: hasPapers,
                        seller_name: sellerName,
                        url,
                        scraped_at: new Date().toISOString()
                    });

                } catch (err) {
                    log.warning(`Error parsing Chrono24 item: ${err.message}`);
                }
            });
        }
    });

    const urls = [
        'https://www.chrono24.com/rolex/index.htm',
        'https://www.chrono24.com/rolex/submariner--mod126610.htm',
        'https://www.chrono24.com/rolex/gmtmaster--mod126710.htm'
    ];

    await crawler.run(urls);
    return results;
}

async function saveToSupabase(listings) {
    const results = { inserted: 0, errors: [] };

    if (!supabase) {
        console.log('Supabase not configured');
        return results;
    }

    // Match listings to products
    const { data: products } = await supabase.from('products').select('*');
    const productsByRef = new Map(products?.map(p => [p.ref_number, p.id]) || []);

    for (const listing of listings) {
        try {
            // Try to match to product
            let productId = null;
            const refMatch = listing.title.match(ROLEX_REFS);
            if (refMatch && productsByRef.has(refMatch[1])) {
                productId = productsByRef.get(refMatch[1]);
            }

            const row = {
                source: listing.source,
                source_id: listing.source_id,
                title: listing.title,
                price: listing.price,
                currency: listing.currency,
                condition: listing.condition,
                has_box: listing.has_box || false,
                has_papers: listing.has_papers || false,
                seller_name: listing.seller_name || null,
                url: listing.url,
                image_url: listing.image_url || null,
                product_id: productId,
                scraped_at: listing.scraped_at
            };

            const { error } = await supabase
                .from('listings')
                .upsert(row, { onConflict: 'source_id' });

            if (error) {
                results.errors.push({ title: listing.title, error: error.message });
            } else {
                results.inserted++;
            }

        } catch (err) {
            results.errors.push({ title: listing.title, error: err.message });
        }
    }

    return results;
}

Actor.main(async () => {
    console.log('🏁 Crown Deals Scraper v2\n');

    const input = await Actor.getInput();
    const source = input?.source || 'all';

    let allResults = [];

    // Scrape eBay
    if (source === 'ebay' || source === 'all') {
        console.log('📦 Scraping eBay...');
        const ebayResults = await scrapeEBay();
        console.log(`✅ eBay: ${ebayResults.length} listings`);
        allResults = allResults.concat(ebayResults);
    }

    // Scrape Chrono24
    if (source === 'chrono24' || source === 'all') {
        console.log('⏱️ Scraping Chrono24...');
        const chronoResults = await scrapeChrono24();
        console.log(`✅ Chrono24: ${chronoResults.length} listings`);
        allResults = allResults.concat(chronoResults);
    }

    // Save to Supabase
    console.log('\n💾 Saving to Supabase...');
    const saveResults = await saveToSupabase(allResults);
    console.log(`✅ Inserted: ${saveResults.inserted}, Errors: ${saveResults.errors.length}`);

    if (saveResults.errors.length > 0) {
        console.log('⚠️ First error:', saveResults.errors[0]);
    }

    // Push to Apify dataset
    await Actor.pushData({
        total_scraped: allResults.length,
        inserted: saveResults.inserted,
        errors_count: saveResults.errors.length,
        sample: allResults.slice(0, 5)
    });

    console.log('\n🎉 Done!');
});