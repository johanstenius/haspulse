# Haspulse — Product Specification

> Cron monitoring that just works

## Overview

Haspulse is a monitoring service for cron jobs, scheduled tasks, and background workers. It uses the dead man's switch pattern: monitored jobs ping Haspulse on success, and Haspulse alerts you when pings don't arrive on time.

**Target market:** Indie developers, small teams, startups who need reliable job monitoring without enterprise complexity or pricing.

**Positioning:** Modern alternative to Healthchecks.io with better DX, status pages included, and fair pricing.

**Domain:** haspulse.io (to be acquired)

---

## Tech Stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| Frontend | Next.js (App Router) | Vercel |
| API | Node.js / Express or Next.js API routes | Railway |
| Database | PostgreSQL | Railway |
| Auth | BetterAuth | — |
| Email | SendPigeon | — |
| Payments | Stripe | — |

**Architecture:**

```
[Browser] → Vercel (Next.js frontend)
                ↓
[API calls] → Railway (API server)
                ↓
           PostgreSQL (Railway)

[Cron jobs] → Railway API (ping endpoints)

[Scheduler] → Runs on Railway, checks for late pings every 60s
```

---

## Pricing

| Plan | Checks | Ping History | Retention | Body Limit | Price |
|------|--------|--------------|-----------|------------|-------|
| Free | 10 | 50 per check | 90 days | 100KB | $0 |
| Pro | 100 | 500 per check | 90 days | 1MB | $12/mo |

**Future tiers (not MVP):**
- Team plan with team members, SSO, etc.

---

## Authentication

**Provider:** BetterAuth

**Methods:**
- Email + password
- Magic link (email)
- OAuth: Google
- OAuth: GitHub

---

## Core Concepts

### Account
A user's account. One account can have multiple projects.

### Project
A container for checks and integrations. Each project has:
- Name
- Slug (used in ping URLs)
- Timezone (default UTC)
- Status page settings
- Alert integrations

### Check
A single job being monitored. Each check has:
- Name
- Slug (optional, for friendly ping URLs)
- ID (NanoID, 16 chars, always generated)
- Schedule (period-based or cron expression)
- Grace period
- Timezone (inherits from project, can override)
- Status: `new` | `up` | `late` | `down` | `paused`
- Associated alert integrations

### Ping
An incoming signal from a monitored job. Each ping records:
- Timestamp
- Type: `success` | `start` | `fail`
- Source IP
- Request body (if provided, up to limit)
- Request method (GET/POST)

### Integration
A configured alert destination. Types:
- Email
- Slack (webhook)
- Webhook (generic)

---

## Features

### MVP

#### Checks
- Create, edit, delete, pause checks
- Schedule via period ("every 1 hour") or cron expression ("0 3 * * *")
- Configurable grace period
- Timezone support per check
- Status tracking: new → up → late → down

#### Ping Endpoints
- ID-based: `POST/GET haspulse.io/ping/{id}`
- Slug-based: `POST/GET haspulse.io/ping/{project-slug}/{check-slug}`
- Signal types via path suffix:
  - `/ping/{id}` — success (default)
  - `/ping/{id}/start` — job started
  - `/ping/{id}/fail` — job failed
- Request body capture (for logs)
- Fast response, always returns 200 OK
- Rate limited: 10 requests/minute per check

**ID format:** NanoID (16 chars, URL-safe). Example: `V1StGXR8_Z5jdHi6`

#### Ping History
- Log of recent pings per check
- Shows timestamp, type, body preview
- Limited by plan (50/500 pings)

#### Alerts
- Trigger on: check goes down, check recovers
- Optional: repeat reminder every X hours if still down (configurable per check, off by default)
- Channels:
  - **Email:** via SendPigeon
  - **Slack:** incoming webhook
  - **Webhook:** generic POST with JSON payload

#### Alert Payload (webhook)
```json
{
  "event": "check.down" | "check.up",
  "check": {
    "id": "V1StGXR8_Z5jdHi6",
    "slug": "db-backup",
    "name": "Database backup",
    "status": "down",
    "last_ping": "2025-01-07T03:00:00Z"
  },
  "project": {
    "slug": "acme-prod",
    "name": "Acme Production"
  },
  "timestamp": "2025-01-07T04:15:00Z"
}
```

#### Dashboard
- List all checks with status, last ping, schedule
- Filter by status (all, healthy, issues, paused)
- Quick actions: pause, delete, copy ping URL
- Stats overview: total checks, healthy, needs attention

#### Status Page
- Public page per project
- Subdomain: `{project-slug}.haspulse.io`
- Configure which checks are visible
- Shows current status per visible check
- Overall status indicator
- Branded with customer logo (optional)
- "Powered by Haspulse" footer

#### Projects
- Multiple projects per account
- Project-level settings: timezone, integrations
- Project-level API keys

#### API
- RESTful JSON API
- Endpoints for:
  - Checks: list, create, read, update, delete, pause
  - Pings: list history for a check
  - Projects: list, create, read, update, delete
  - Integrations: list, create, delete
- Auth via API key (per project)
- Full OpenAPI spec

### Post-MVP / Later

- **TypeScript SDK** — wrapper around API for better DX
- **Teams** — invite members to projects, role-based access
- **Custom domains** — bring your own domain for status page
- **SMS alerts** — via Twilio or similar
- **Uptime monitoring** — active HTTP checks (polls your endpoints)
- **More OAuth providers** — GitLab, Bitbucket
- **Incident history** — timeline of past incidents on status page
- **Maintenance windows** — scheduled downtime that doesn't alert
- **Badge embeds** — status badges for READMEs

---

## Data Model (High Level)

**Note:** All entity IDs use NanoID (16 chars) for URL-safe, readable identifiers.

```
Account
├── id (NanoID)
├── email
├── name
├── created_at
└── plan (free | pro)

Project
├── id (NanoID)
├── account_id → Account
├── name
├── slug (unique)
├── timezone
├── status_page_enabled
├── status_page_title
├── status_page_logo_url
├── created_at

Check
├── id (NanoID, 16 chars, primary key)
├── project_id → Project
├── name
├── slug (unique within project)
├── schedule_type (period | cron)
├── schedule_value ("3600" or "0 3 * * *")
├── grace_seconds
├── timezone (nullable, inherits from project)
├── status (new | up | late | down | paused)
├── last_ping_at
├── last_started_at
├── alert_on_recovery (boolean)
├── reminder_interval_hours (nullable)
├── created_at

Ping
├── id (NanoID)
├── check_id → Check
├── type (success | start | fail)
├── body (text, nullable)
├── source_ip
├── created_at

Integration
├── id (NanoID)
├── project_id → Project
├── type (email | slack | webhook)
├── config (jsonb — email address, webhook URL, etc.)
├── created_at

CheckIntegration (many-to-many)
├── check_id → Check
├── integration_id → Integration
```

---

## Scheduler Logic

Runs every 60 seconds on Railway:

```
For each check where status != 'paused':
    
    expected_at = calculate_next_expected(check.schedule, check.last_ping_at)
    deadline = expected_at + check.grace_seconds
    
    if now > deadline AND check.status == 'up':
        check.status = 'late'
        # No alert yet, just mark late
    
    if now > deadline + grace_seconds AND check.status == 'late':
        check.status = 'down'
        trigger_alert('check.down', check)
    
    if check has reminder AND check.status == 'down':
        if last_alert_at + reminder_interval < now:
            trigger_alert('check.still_down', check)
```

On ping received:
```
if check.status == 'down':
    check.status = 'up'
    if check.alert_on_recovery:
        trigger_alert('check.up', check)
else:
    check.status = 'up'

check.last_ping_at = now
create_ping_record()
```

---

## URL Structure

**Marketing site:**
- `haspulse.io` — landing, pricing, docs

**App:**
- `app.haspulse.io` — dashboard, login, settings

**Ping endpoints:**
- `haspulse.io/ping/{id}` (e.g., `haspulse.io/ping/V1StGXR8_Z5jdHi6`)
- `haspulse.io/ping/{id}/start`
- `haspulse.io/ping/{id}/fail`
- `haspulse.io/ping/{project-slug}/{check-slug}`
- `haspulse.io/ping/{project-slug}/{check-slug}/start`
- `haspulse.io/ping/{project-slug}/{check-slug}/fail`

**Status pages:**
- `{project-slug}.haspulse.io`

**API:**
- `api.haspulse.io/v1/...`

---

## Open Questions / Future Decisions

1. ~~**Rate limiting on ping endpoints?**~~ ✅ 10 req/min per check.

2. ~~**How long to keep ping history?**~~ ✅ 90 days OR count limit (whichever reached first).

3. **Webhook retry logic?** If Slack/webhook fails, retry 3x with backoff? Or fire-and-forget?

4. **Grace period defaults?** Suggest sensible defaults based on schedule (5min for hourly, 1hr for daily).

5. ~~**Check limits enforcement?**~~ ✅ Hard limit — block creation, show upgrade prompt.

---

## Success Metrics

**Launch goals:**
- 100 signups in first month
- 10 paying customers in first 3 months
- <1% ping endpoint error rate

**Long-term:**
- $1-3K MRR as lifestyle business
- <2 hours/week maintenance

---

## References

- Healthchecks.io — primary competitor, open source
- Cronitor — feature-rich but expensive
- Better Stack — modern but broader scope
- Dead Man's Snitch — simple, older

---

*Last updated: January 2025*
