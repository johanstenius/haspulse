# HasPulse Product Analysis

## Current State Summary

HasPulse is a **cron job/heartbeat monitoring service** (similar to Healthchecks.io) - NOT a traditional uptime monitoring service like Pingdom/UptimeRobot (which actively ping your servers).

**Your model**: Services ping HasPulse → if ping misses expected window → alert
**Pingdom model**: Pingdom pings your servers → if no response → alert

This is a **critical positioning distinction**.

---

## Feature Inventory

### Fully Built

| Feature | Status | Notes |
|---------|--------|-------|
| Heartbeat/Cron monitoring | Complete | Period + Cron schedules, grace periods |
| 8 Alert channels | Complete | Email, Slack (OAuth+Webhook), Discord, PagerDuty, OpsGenie, Webhook |
| Multi-org + Teams | Complete | Roles (owner/admin/member), invitations |
| Projects | Complete | Multiple per org, custom settings |
| Billing (Stripe) | Complete | Free/Pro tiers, checkout, portal |
| API Keys | Complete | Per-project scoped |
| Badges | Complete | SVG embeddable |
| Onboarding | Complete | 4-step wizard |
| Documentation | Complete | API, SDK, integrations |
| Cron Calculator | Complete | Public utility tool |

### Removed (Simplification)

| Feature | Status | Reason |
|---------|--------|--------|
| Status Pages | Removed | Cron jobs are internal - no need for public status |
| Incidents | Removed | Manual incident management is a separate product |
| Maintenance Windows | Removed | Complexity without clear use case for cron monitoring |
| Custom Domains | Removed | Was only for status pages |

### Not Built (vs Competition)

| Feature | Competitors | Notes |
|---------|-------------|-------|
| Active HTTP monitoring | Pingdom, Better Stack, UptimeRobot | They ping YOUR server |
| SSL certificate monitoring | All major competitors | Expiry alerts |
| Domain expiry monitoring | UptimeRobot | DNS expiry alerts |
| Multi-region checks | All major competitors | Check from 10+ global locations |
| Playwright/browser checks | Better Stack | Real browser transactions |
| RUM (Real User Monitoring) | Pingdom | Actual user experience |
| Response time tracking | All | Latency graphs |
| Mobile apps | UptimeRobot, Better Stack | iOS/Android |
| SMS/Voice alerts | Better Stack (unlimited), UptimeRobot | None currently |
| On-call scheduling | Better Stack, PagerDuty | Rotation schedules |
| Log management | Better Stack | Centralized logs |
| Metrics/APM | Better Stack, Datadog | Performance metrics |

---

## Competitive Positioning

### Direct Competitor: Healthchecks.io

**Most similar to HasPulse** - both are heartbeat/cron monitors.

| Feature | HasPulse | Healthchecks.io |
|---------|----------|-----------------|
| Free checks | 20 | 20 |
| Pricing | $12/mo (100 checks) | ~$8/mo (50 checks) |
| Open source | No | Yes (BSD) |
| Self-hosted | No | Yes |
| Start/Fail signals | Yes | Yes |
| Ping body storage | Yes (100KB-1MB) | Yes |
| Teams/Orgs | Yes | Yes |
| SMS/WhatsApp | No | Yes (paid) |
| Phone calls | No | Yes (paid) |
| Status pages | No | No |
| Incidents | No | No |

### Full-Stack Competitors

| Service | Positioning | Free Tier | Key Differentiator |
|---------|-------------|-----------|-------------------|
| Better Stack | All-in-one (uptime+logs+incidents) | 10 monitors | Beautiful design, unlimited SMS/calls |
| UptimeRobot | Budget uptime monitoring | 50 monitors | Generous free tier, simple |
| Pingdom | Enterprise RUM + synthetic | None | Real user monitoring |
| Cronitor | Cron + uptime hybrid | 5 monitors | Combines both models |

---

## Feature Prioritization

### MUST HAVE (Table stakes - missing these kills you)

1. **SMS/Voice alerts** - Critical for production outages
   - Competition: All offer this
   - Impact: Users won't trust you for critical jobs without phone alerts

2. **Slack App channel completion** - OAuth exists but verify full workflow
   - Competition: Standard feature

3. **Email verification flow** - Ensure it's bulletproof
   - Competition: Basic requirement

### NEED TO HAVE (Competitive parity)

1. **Self-hosted/Open source option**
   - Healthchecks.io main advantage
   - Many teams want on-prem for security

2. **More generous free tier**
   - HasPulse: 10 checks
   - UptimeRobot: 50
   - Healthchecks: 20
   - Consider 20-25 to match

3. **Longer ping retention**
   - 90 days is good, but Pro could offer 1 year

4. **Better webhook payloads**
   - Custom templates, variables

5. **Alert acknowledgment**
   - "I'm working on it" button

### NICE TO HAVE (Differentiation)

1. **Active HTTP checks** (expand market)
   - Add traditional uptime monitoring
   - Becomes hybrid like Cronitor

2. **Mobile app**
   - Push notifications
   - Quick status view

3. **Grafana/Prometheus integration**
   - DevOps audience loves this

4. **CLI tool**
   - `haspulse ping check-123`

5. **Multi-region ping verification**
   - Verify pings from multiple regions before alerting

6. **Run duration tracking**
   - Start → End timing analytics

---

## Your Edge (Potential Differentiation)

### Current Strengths

1. **Modern tech stack** - Clean codebase, good DX
2. **Beautiful UI** - Modern shadcn/Radix components
3. **Sparkline visualizations** - Nice touch for quick status
4. **Focused product** - Pure cron/heartbeat monitoring, no bloat
5. **Dashboard = Status view** - All your checks in one place

### Opportunity Areas

1. **"Simple, beautiful cron monitoring"**
   - Position as the modern, focused alternative

2. **Developer experience**
   - Best-in-class SDK
   - One-liner integrations
   - Copy-paste snippets for every language

3. **Cron calculator as SEO play**
   - `/cron` page drives organic traffic

4. **Team features**
   - Better collaboration than Healthchecks.io

5. **API-first design**
   - Full OpenAPI spec
   - Terraform provider potential

---

## Gap Analysis Summary

```
                    HasPulse    Healthchecks   Better Stack   UptimeRobot
─────────────────────────────────────────────────────────────────────────
Heartbeat/Cron        ✅            ✅              ✅             ✅
Active HTTP           ❌            ❌              ✅             ✅
SMS/Voice             ❌            ✅              ✅             ✅
Self-hosted           ❌            ✅              ❌             ❌
Free tier size        20            20              10             50
Mobile app            ❌            ❌              ✅             ✅
```

---

## Recommendations

### Phase 1: Parity
1. Add SMS alerts (Twilio) - **CRITICAL**
2. ~~Bump free tier to 20 checks~~ Done
3. Add alert acknowledgment

### Phase 2: Differentiation
1. SDK packages (npm, pip, gem, crate)
2. CLI tool
3. Webhook templates

### Phase 3: Market Expansion
1. Active HTTP monitoring (optional add-on)
2. Mobile app
3. Open source core?

---

## Questions to Resolve

- Target market: developers vs DevOps vs SREs?
- Pricing: $12/mo competitive enough?
- Self-host: dealbreaker for some teams?
- SMS: Twilio costs pass-through or included?
- Active monitoring: expand scope or stay focused?

---

## Sources

- [UptimeRobot Best Tools Comparison](https://uptimerobot.com/knowledge-hub/monitoring/11-best-uptime-monitoring-tools-compared/)
- [Better Stack Pricing](https://betterstack.com/pricing)
- [Better Stack Uptime](https://betterstack.com/uptime)
- [Healthchecks.io Pricing](https://healthchecks.io/pricing/)
- [Healthchecks.io Documentation](https://healthchecks.io/docs/)
- [Better Stack G2 Pricing](https://www.g2.com/products/better-stack/pricing)
