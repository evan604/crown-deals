# Crown Deals Apify Actor

Scrapes Rolex watch listings from eBay and Chrono24.

## Input Schema

```json
{
  "source": "ebay|chrono24|all",
  "Search": {
    "queries": ["rolex submariner", "rolex gmt"]
  },
  "models": [
    "https://www.chrono24.com/rolex/submariner--mod126610.htm"
  ]
}
```

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for inserts)

## Deploy

1. Zip this folder
2. Upload to Apify Console → Actors → Create Actor
3. Set environment variables
4. Run with your input
