# 👑 CrownDeals

AI-powered Rolex deal finder. Monitors Chrono24, eBay & dealers — alerts you when legitimately good deals drop.

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black)](https://crownfinder.com)
[![Scraper](https://img.shields.io/badge/scraper-v2.7-green)](./scrapers/)

## The Problem

Gray market Rolex pricing is opaque. You either:
- Check Chrono24 obsessively (wastes hours)
- Hope you catch a good deal (miss it by minutes)
- Overpay because you didn't know market price ($3-4K+ premium)

## The Solution

CrownDeals uses AI to:
1. **Scan** — Scrapes Chrono24, eBay every 15-30 min
2. **Score** — Claude AI scores deals 0-10 vs 90-day market data
3. **Alert** — Instant email/SMS when deals match your criteria

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Scraping | Apify (Playwright) |
| AI | Claude API |
| Email | Resend |
| SMS | Twilio |
| Payments | Stripe |
| Hosting | Vercel |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Apify     │────→│  Supabase   │────→│   Next.js   │
│  Scrapers   │     │  Database   │     │   App/API   │
└─────────────┘     └─────────────┘     └─────────────┘
                              │                  │
                              ↓                  ↓
                       ┌─────────────┐     ┌─────────────┐
                       │ 90-Day Price│     │ Claude API  │
                       │   History   │     │ Deal Scorer │
                       └─────────────┘     └─────────────┘
                                               │
                                               ↓
                                        ┌─────────────┐
                                        │ Resend/Twilio│
                                        │   Alerts    │
                                        └─────────────┘
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Apify account
- Claude API key
- (Optional) Resend, Twilio, Stripe accounts

### Local Development

```bash
# Clone
git clone https://github.com/evan604/crown-deals.git
cd crown-deals

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your keys

# Run dev server
npm run dev
```

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
APIFY_API_TOKEN=apify_api_...
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for full features)
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
STRIPE_SECRET_KEY=sk_test_...
```

## Scrapers

### Chrono24 Rolex Scraper
- **Location:** `scrapers/apify-actor/`
- **Status:** v2.7 Live
- **Extracts:** Title, price, condition, seller, URL
- **Schedule:** Every 30 min

### eBay Rolex Scraper
- **Location:** `scrapers/ebay/`
- **Status:** v1.0 Ready
- **Models:** Submariner, Daytona, Datejust, GMT-Master, Yacht-Master
- **Schedule:** Every 15 min

```bash
# Deploy to Apify
cd scrapers/ebay
apify login --token $APIFY_TOKEN
apify push
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/score` | POST | Score a listing with Claude AI |
| `/api/waitlist` | POST | Join waitlist |
| `/api/alert` | POST | Trigger deal alerts |
| `/api/scrape/:source` | POST | Manual scrape trigger |
| `/api/webhooks/stripe` | POST | Subscription lifecycle |

### Example: Score a Deal

```bash
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Rolex Submariner 126610LN 2023 Full Set",
    "price": 11800,
    "condition": "unworn",
    "has_box": true,
    "has_papers": true,
    "seller_rating": 98,
    "source": "chrono24"
  }'
```

Response:
```json
{
  "deal_score": 8.5,
  "deal_summary": "Good deal: $800 below 90-day average, full set",
  "confidence": "high",
  "key_factors": ["Below market", "Full set", "Top seller"]
}
```

## Database Schema

See `db/schema_postgres.sql` — includes:
- `products` — Catalog of Rolex references
- `listings` — Scraped watch listings
- `users` — Subscribers & tier info
- `price_history` — Historical price data
- `scraper_runs` — Job tracking

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Setup

1. Create Supabase project
2. Run `db/schema_postgres.sql`
3. Add env vars to Vercel dashboard
4. Deploy scrapers to Apify
5. Configure Stripe webhooks

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 alerts/day, ad-supported |
| **Collector** | $29.99/mo | Unlimited alerts, real-time email, AI chat |
| **Premium** | $49.99/mo | + SMS alerts, concierge support, priority |

## Roadmap

**Phase 1 (Now):**
- [x] eBay scraper
- [x] Deal scoring API
- [x] Waitlist system
- [ ] Supabase connection
- [ ] Email alerts (Resend)

**Phase 2:**
- [ ] SMS alerts (Twilio)
- [ ] Stripe payments
- [ ] Discord bot
- [ ] Web dashboard

**Phase 3:**
- [ ] Mobile app
- [ ] Watch market analytics
- [ ] Dealer portal

## Related

- **Landing Page:** [crownfinder.com](https://crownfinder.com)
- **Parent Co:** [CollectorIQ](./CROWN_DEALS_MASTER.md)
- **Validation:** [r/Watches](./marketing/reddit_validation_post.md)

## License

Private — CollectorIQ/HPO

---

Built by Tazer 🐺 for [Evan Borenstein](https://highlandprivateoffice.com)
