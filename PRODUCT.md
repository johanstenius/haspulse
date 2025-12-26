# Haspulse — Product Vision

> Dead simple cron monitoring with status pages included

## The Problem

Scheduled jobs fail silently. Database backups, email campaigns, data syncs, report generators — when they stop running, you don't know until something breaks. Existing solutions are either:

1. **Too expensive** — Cronitor at $2/monitor/month adds up fast. 50 jobs = $100/month.
2. **Too complex** — Better Stack bundles incident management, on-call scheduling, observability. Overkill for "did my backup run?"
3. **Too barebones** — Healthchecks.io is cheap but lacks status pages. Dead Man's Snitch has no team features.
4. **Enterprise-focused** — Atlassian Statuspage starts at $29/month just for status pages, $399/month for useful features.

Indie developers and small teams need something in between: reliable monitoring with status pages, at a price that makes sense.

---

## Our Offer

**Core value prop:** Cron monitoring + status pages for $12/month.

| What you get | Free | Pro ($12/mo) |
|--------------|------|--------------|
| Checks | 10 | 100 |
| Projects | 2 | Unlimited |
| Ping history | 50/check | 500/check |
| Retention | 90 days | 90 days |
| Status pages | Yes | Yes |
| Custom domains | No | Yes |
| Team members | No | Yes |
| Incidents/maintenance | Yes | Yes |

**Why $12?** Cheaper than Cronitor (100 jobs = $200/month), simpler than Better Stack ($29/month + team fees), includes status pages that Healthchecks.io lacks.

---

## Features Built

### Core Monitoring
- **Dead man's switch pattern** — Jobs ping Haspulse on success, we alert when pings don't arrive
- **Dual addressing** — Ping by ID (`/ping/V1StGXR8_Z5jdHi6`) or slug (`/ping/acme-prod/db-backup`)
- **Lifecycle signals** — `/start`, `/fail` suffixes for job tracking
- **Flexible scheduling** — Interval-based ("every 1 hour") or cron expressions
- **Configurable grace** — Don't alert on momentary delays
- **Status flow** — NEW → UP → LATE → DOWN → (recovery)

### Alerting
- **Multi-channel** — Email, Slack (webhook + OAuth app), Discord, PagerDuty, Opsgenie, webhooks
- **Per-check routing** — Different checks can alert different channels
- **Recovery alerts** — Know when things are back up
- **Reminder alerts** — Repeat if still down (optional)

### Status Pages
- **Public pages** — `{project}.haspulse.dev` or custom domain
- **90-day uptime bars** — Visual uptime history
- **Incidents** — Create, update, resolve with status updates
- **Maintenance windows** — Scheduled downtime that doesn't alert
- **Branding** — Custom logo, title

### Developer Experience
- **OpenAPI spec** — Full API documentation
- **TypeScript SDK** — `npm install haspulse`
- **SVG badges** — Embed status in READMEs
- **API keys** — Per-project, hashable, rotatable
- **Magic links** — Passwordless auth option

### Organization
- **Multi-project** — Organize checks by environment, team, product
- **Role-based access** — Owner, admin, member
- **Stripe billing** — Self-serve upgrade/downgrade
- **14-day trial** — Pro features free for 2 weeks

---

## Competitive Edge

| | Haspulse | Healthchecks.io | Cronitor | Better Stack |
|---|----------|-----------------|----------|--------------|
| **100 checks** | $12/mo | $30/mo | $200/mo | Custom |
| **Status pages** | Included | No | Extra | Included |
| **Custom domains** | Pro | No | Extra | Pro |
| **Incidents** | Yes | No | Yes | Yes |
| **TypeScript SDK** | Yes | Community | Yes | Yes |
| **Open source** | No | Yes | No | No |
| **Setup time** | 5 min | 5 min | 10 min | 15 min |

**Our position:** Modern Healthchecks.io alternative with status pages and better DX.

---

## Target Market

**Primary:** Indie developers and small teams (1-10 people) running production services who:
- Have 10-100 scheduled jobs
- Need to know when things break, fast
- Want a status page without paying enterprise pricing
- Value simple, clean tooling over feature bloat

**Use cases:**
- SaaS products monitoring background workers
- E-commerce sites tracking inventory syncs
- Data pipelines monitoring ETL jobs
- DevOps teams tracking backup scripts

---

## What We Don't Do (And Why)

- **Active uptime monitoring** — Different problem, different tools. Stick to cron.
- **Log aggregation** — Papertrail/Logtail do this better. We just store ping bodies.
- **On-call scheduling** — Better Stack/PagerDuty territory. We just route alerts.
- **APM/tracing** — Different domain entirely.
- **Self-hosting** — Healthchecks.io wins here. We're managed-only.

Staying focused = better product for our use case.

---

## Roadmap

### Must Have (for launch)
- [ ] Team member invites (API + UI)
- [ ] Incidents/maintenance admin UI
- [ ] Production deployment
- [ ] Landing page polish

### Should Have (post-launch)
- [ ] SMS alerts (Twilio)
- [ ] Maintenance windows per check
- [ ] Badge customization (colors, styles)
- [ ] Webhook retry configuration

### Nice to Have (future)
- [ ] Active HTTP monitoring (uptime checks)
- [ ] More OAuth providers (GitLab, Bitbucket)
- [ ] SSO/SAML for enterprise
- [ ] On-premises deployment option
- [ ] Audit logs

---

## Success Metrics

**Launch:**
- 100 signups in month 1
- 10 paying customers in 3 months
- <1% ping endpoint error rate
- <100ms p95 ping latency

**6 months:**
- $500 MRR
- <2 hours/week maintenance
- NPS > 40

**Long-term:**
- $1-3K MRR (lifestyle business)
- Profitable on Vercel + Railway
- Word-of-mouth growth

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| API | Hono + zod-openapi | Type-safe, fast, OpenAPI-first |
| Database | PostgreSQL + Prisma | Reliable, migrations, type-safe |
| Frontend | Next.js (App Router) | SSR, React, ecosystem |
| Auth | BetterAuth | Email, OAuth, magic links, simple |
| Email | SendPigeon | Our own product, dog-fooding |
| Payments | Stripe | Industry standard |
| Hosting | Vercel + Railway | Simple, scales, affordable |

---

## Key Decisions Made

1. **NanoID over UUID** — Shorter, URL-safe, readable
2. **Channels over Integrations** — Clearer mental model
3. **Repository pattern** — Clean separation, testable
4. **Per-project API keys** — Scope access, easier rotation
5. **Status pages included** — Key differentiator, not upsell
6. **No self-host** — Focus on managed service, compete on DX

---

## Competitive Research Sources

- [Better Stack Cron Comparison](https://betterstack.com/community/comparisons/cronjob-monitoring-tools/)
- [CronRadar Best Tools](https://cronradar.com/comparisons/best-cron-monitoring-tools)
- [Healthchecks.io vs Cronitor](https://healthchecks.io/docs/healthchecks_cronitor_comparison/)
- [Dead Man's Snitch Pricing](https://deadmanssnitch.com/plans)
- [Statuspage Pricing](https://www.atlassian.com/software/statuspage/pricing)
- [Instatus Alternative](https://instatus.com/statuspage-alternative)
- [StatusGator Pricing Overview](https://statusgator.com/blog/how-much-does-a-status-page-cost/)
