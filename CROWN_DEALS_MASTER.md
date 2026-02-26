# CrownDeals - Master Specification
**Project:** CrownDeals (CollectorIQ Vertical #1)  
**Status:** Refined & Ready for Build  
**Last Updated:** 2026-02-26 by Tazer  
**GitHub:** https://github.com/evan604/crown-deals

---

## 🎯 Executive Summary

CrownDeals is the **Rolex/luxury watch vertical** under the **CollectorIQ** umbrella brand. It uses AI-powered deal intelligence to help buyers navigate the gray market with confidence.

**Why This Vertical First:**
- **Highest ARPU:** $49/mo + $850 avg affiliate commission = $1,450 LTV
- **Clear pain point:** Gray market pricing is genuinely opaque
- **Concentrated users:** r/Watches (500K+), WatchUSeek, Discord communities
- **Validation:** If it works here, cloning to LEGO, Patek, bags trivial

---

## 🏗️ Umbrella Model: CollectorIQ

| Vertical | Brand | Price | Avg Item Value | Launch Order |
|----------|-------|-------|----------------|--------------|
| Rolex | **CrownDeals** | $49/mo | $15,000 | **Wave 1** (Now) |
| Patek/AP/VC | HauteTime | $99/mo | $50,000+ | Wave 2 (Month 4) |
| LEGO | BrickScout | $12.99/mo | $150 | Wave 2 (Month 4) |
| Playmobil | PlayFind | $7.99/mo | $60 | Wave 3 (Month 7) |
| LV/Hermès | BagHunter | $39/mo | $8,000 | Wave 3 (Month 7) |
| Sneakers | SoleSignal | $14.99/mo | $300 | Wave 3 (Month 7) |
| Trading Cards | CardVault | $19.99/mo | $500 | Wave 3 (Month 7) |

**Architecture:** Shared backend (Supabase, Claude API, scoring engine) → Branded micro-frontends per vertical

---

## 💰 Revised Monetization (CrownDeals)

### Tier Structure

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 alerts/day, email digest, **ad-supported**, affiliate revenue |
| **Collector** | $29.99/mo | Unlimited alerts, real-time email, AI chat, **no ads** |
| **Premium** | $49.99/mo | + SMS alerts, concierge support, priority scoring |

### Revenue Per Premium User (Yearly)
- **Subscription:** $50 × 12 = $600
- **Affiliate:** 2-3 sales × $15K × 2.5% = $750-1,125 (avg $850)
- **Total LTV:** **~$1,450/year**

### Free Tier Ad Strategy
- Banner ads (non-intrusive)
- "Sponsored featured listings" (clearly marked)
- 1 sponsored placement in email digest
- Referral program: 1 month free per successful referral

---

## 🚀 Go-to-Market

### Phase 1: Closed Beta (Weeks 1-8)
**Target:** 50 beta users
- **Channels:** r/Watches, WatchUSeek, Discord, YouTube partnerships
- **Incentive:** Free Premium for life for detailed feedback
- **Success:** 50 activated, 20 deals/week surfaced, 40%+ "would pay"

### Phase 2: Public Launch (Months 3-4)
- SEO for "Rolex Submariner deals," "best gray market prices"
- YouTube affiliate partnerships (demo videos)
- Referral program (1 mo free per signup)

### Phase 3: Scale (Months 6-12)
- Launch HauteTime (Patek) and BrickScout (LEGO)
- Pre-launch waitlists for new verticals
- Influencer "co-founder" equity deals

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (Vercel) |
| Database | Supabase (PostgreSQL) |
| Scraping | Apify |
| AI | Claude API |
| Email | Resend |
| SMS | Twilio |
| Payments | Stripe |
| Monitoring | TBD (Grafana?) |

---

## 📊 Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Free→Paid Conversion | 8-12% | — |
| Monthly Churn | <5% | — |
| Time to First Good Deal | <48 hours | — |
| Avg Deal Score Accuracy | 80%+ | — |
| Year 1 Paid Subscribers | 1,000 | — |
| Year 1 ARR | $600K | — |

---

## ✅ Immediate Next Steps

**Before Build:**
1. ✅ Document refined (this file)
2. ✅ GitHub repo created: https://github.com/evan604/crown-deals
3. ⬜ Create Supabase project
4. ⬜ Get Claude API key
5. ⬜ Sign up for Apify, Resend, Twilio, Stripe
6. ⬜ Validate demand: Post in r/Watches "Would you pay $30/mo for AI deal alerts?"
7. ⬜ Hire part-time Next.js dev (Toptal/Gun.io/Upwork)

**Build Phase 1 (Week 1):**
- Set up Supabase schema
- Configure Apify eBay + Amazon scrapers
- Build data normalization layer
- Validate data flow

---

## 🗂️ Files

- `/Users/evanborenstein/clawd/projects/crown_deals/business_plan_v2.md` — Full business plan
- `https://github.com/evan604/crown-deals` — GitHub repo
- `/Users/evanborenstein/clawd/CROWN_DEALS_MASTER.md` — This file (quick reference)

---

## 👥 Team Access

- **Tazer:** Primary AI assistant
- **Crabby:** Shared GitHub access via `/shared/` bridge
- **Human:** Evan Borenstein (Highland Private Office)

**Questions? Updates?** Check GitHub issues or add to this doc.

---

*This document is the single source of truth for CrownDeals v2.0. Last updated by Tazer on 2026-02-26.*
