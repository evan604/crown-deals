# CrownDeals — Deployment Checklist (Updated 2026-03-03)

## ✅ COMPLETED (This Morning)
_7 commits, 860+ lines shipped_

| Component | Status | Location |
|-----------|--------|----------|
| eBay Scraper | ✅ Ready | `scrapers/ebay/` |
| Deal Scoring API | ✅ Ready | `app/api/score/route.ts` |
| Waitlist API | ✅ Ready | `app/api/waitlist/route.ts` |
| Alert System | ✅ Ready | `app/api/alert/route.ts` |
| Stripe Webhooks | ✅ Ready | `app/api/webhooks/stripe/` |
| Price Seeder | ✅ Ready | `scripts/seed_price_history.py` |
| Vercel Config | ✅ Ready | `vercel.json` |
| Landing Waitlist | ✅ Ready | `index.html` |
| README | ✅ Complete | `README.md` |

---

## ⏳ BLOCKED (Needs Credentials)

### Supabase
- [ ] Create project at supabase.com
- [ ] Run `db/schema_postgres.sql`
- [ ] Copy Project URL: `_________`
- [ ] Copy Anon Key: `_________`
- [ ] Copy Service Role Key: `_________`

### Resend (Email)
- [ ] Sign up at resend.com
- [ ] Create API Key: `re_________________`

### Twilio (SMS)
- [ ] Sign up at twilio.com
- [ ] Buy US phone number: `+1 ________`
- [ ] Account SID: `AC________________`
- [ ] Auth Token: `________________`

### Stripe (Payments)
- [ ] Create account at stripe.com
- [ ] Get test Publishable Key: `pk_test_`
- [ ] Get test Secret Key: `sk_test_`
- [ ] Configure webhook endpoint: `https://crowndeals.vercel.app/api/webhooks/stripe`

### Claude API
- [ ] Generate key at console.anthropic.com
- [ ] Key: `sk-ant-`

### Apify
- [ ] Verify account has credits
- [ ] Token: `apify_api_`

---

## 🚀 FINAL DEPLOY STEPS (After Credentials)

**Estimated time: 15 minutes**

1. **Configure Environment**
   ```bash
   # Paste all credentials into .env.local
   cp .env.example .env.local
   # Edit with your keys
   ```

2. **Push Scrapers to Apify**
   ```bash
   cd scrapers/ebay
   apify login --token $APIFY_TOKEN
   apify push
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   # Add env vars in dashboard OR:
   vercel env add SUPABASE_URL
   # ... repeat for all
   ```

4. **Seed Database**
   ```bash
   node scripts/seed_price_history.js
   # Or: python3 scripts/seed_price_history.py
   ```

5. **Test End-to-End**
   ```bash
   # Trigger manual scrape
   curl -X POST https://crowndeals.vercel.app/api/scrape/ebay
   
   # Check Supabase for data
   # Verify deal scoring
   ```

---

## 📊 Status Tracking

| Milestone | Target | Actual |
|-----------|--------|--------|
| Scrapers | Mar 3 AM | ✅ Done |
| APIs | Mar 3 AM | ✅ Done |
| Deploy | Mar 3 PM | ⏳ Pending credentials |
| Launch | Mar 4 | — |

---

## 🔗 Important Links

- **Main Repo:** https://github.com/evan604/crown-deals
- **Landing Page:** https://crownfinder.com (static now)
- **Shared Workspace:** https://github.com/evan604/openclaw-workspace
- **Validation Post:** `marketing/reddit_validation_post.md`

---

*Last updated by Tazer: 2026-03-03 1:20 PM EST*
