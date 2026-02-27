# CrownDeals Deployment Checklist

## Prerequisites (Need from Evan)
- [ ] Supabase project created + API keys
- [ ] Apify account + residential proxy credits
- [ ] Claude API key
- [ ] Resend API key
- [ ] Stripe account
- [ ] Vercel project (or self-host)

## Deployment Steps (Tazer will execute)

### 1. Database Setup (5 min)
```bash
# Requires: SUPABASE_SERVICE_ROLE_KEY
supabase db push --db-url "$SUPABASE_URL"
# Or run SQL manually in Supabase dashboard
```

### 2. Apify Scrapers (10 min)
```bash
# Requires: APIFY_API_TOKEN
apify login --token "$APIFY_TOKEN"
apify push ebay-rolex
apify push chrono24-rolex

# Set schedules
apify runs:schedule ebay-rolex --cron "*/15 * * * *"  # Every 15 min
apify runs:schedule chrono24-rolex --cron "*/30 * * * *"  # Every 30 min
```

### 3. Vercel Deploy (5 min)
```bash
# Requires: Vercel token + all env vars
vercel --prod
# Add env vars in Vercel dashboard or:
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... etc
```

### 4. Stripe Webhooks (5 min)
- Configure webhook endpoint: `https://crowndeals.vercel.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`

### 5. Test Run (10 min)
- Trigger manual scrape: `POST /api/scrape { "source": "ebay" }`
- Verify data in Supabase
- Check scoring pipeline
- Test alerts with test user

## Post-Launch
- [ ] Monitor scraper health daily
- [ ] Review AI scoring accuracy weekly
- [ ] Adjust deal score thresholds based on user feedback
- [ ] Add Chrono24 scraper (requires residential proxy)

## Estimated Total Time
- With credentials: **30 minutes to first live scrape**
- Without credentials: **Blocked on accounts**
