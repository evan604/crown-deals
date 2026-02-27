# CrownDeals Scrapers

Apify actor configurations for watch deal monitoring.

## Scrapers

| File | Source | Status | Rate Limit |
|------|--------|--------|------------|
| `ebay-rolex.json` | eBay | Ready | 360 req/hr |
| `chrono24-rolex.json` | Chrono24 | Ready | 200 req/hr |

## Deployment

1. Upload to Apify:
   ```bash
   apify push ebay-rolex --token YOUR_TOKEN
   apify push chrono24-rolex --token YOUR_TOKEN
   ```

2. Set schedule:
   - eBay: Every 15 minutes (high velocity)
   - Chrono24: Every 30 minutes (lower churn)

3. Webhook to your API:
   - Target: `https://api.crowndeals.com/v1/hooks/scrape`
   - Or poll from `/api/scrape/poll` endpoint

## Output Format

All scrapers return normalized JSON:

```json
{
  "title": "Rolex Submariner 126610LN",
  "price_usd": 12800,
  "condition": "excellent",
  "has_box": true,
  "has_papers": true,
  "seller_name": "WatchDealerNYC",
  "seller_rating": 98,
  "url": "https://...",
  "source": "chrono24|ebay",
  "scraped_at": "2026-02-26T22:00:00Z"
}
```
