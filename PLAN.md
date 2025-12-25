# Haspulse Implementation Plan

## Phase 1: Core Ping Infrastructure ✅ COMPLETED

- Ping routes (`/ping/{id}`, `/ping/{id}/start`, `/ping/{id}/fail`)
- Slug-based pings (`/ping/{projectSlug}/{checkSlug}`)
- Prisma schema (Project, Check, Ping, Channel, ApiKey)
- Basic services and repositories

---

## Phase 2: Auth + Management API ✅ COMPLETED

- BetterAuth integration (email/password, magic link, OAuth)
- Session + API key authentication
- Management API (`/v1/`) with full CRUD
- Renamed Integration → Channel, nested routes under /projects
- 39 tests passing

**Routes:**
- `GET/POST /v1/projects`
- `GET/PATCH/DELETE /v1/projects/:id`
- `GET/POST /v1/projects/:projectId/checks`
- `GET/PATCH/DELETE /v1/checks/:id`
- `POST /v1/checks/:id/pause`
- `POST /v1/checks/:id/resume`
- `GET /v1/checks/:id/pings`
- `GET/POST /v1/projects/:projectId/channels`
- `GET/PATCH/DELETE /v1/projects/:projectId/channels/:channelId`
- `GET/POST /v1/projects/:projectId/api-keys`
- `DELETE /v1/projects/:projectId/api-keys/:apiKeyId`

---

## Phase 3: Scheduler + Alerts ✅ COMPLETED

- Scheduler worker runs every 60s
- Status transitions: UP → LATE → DOWN with alerts
- Channel senders: Email (TODO), Slack, Webhook with retry
- Recovery alerts on ping after DOWN
- Alert model stores history with success/failure
- 52 tests passing

**Files created:**
- `apps/api/src/lib/schedule.ts`
- `apps/api/src/services/scheduler.service.ts`
- `apps/api/src/services/alert.service.ts`
- `apps/api/src/services/channel-sender.service.ts`
- `apps/api/src/repositories/alert.repository.ts`
- `apps/api/src/worker.ts`

**Scripts:** `pnpm --filter @haspulse/api worker`

---

## Phase 4: Frontend ✅ COMPLETED

### Completed
- ✅ Fix web build issues
- ✅ Add shadcn components (dialog, dropdown-menu, tabs, badge, table, skeleton, sonner, select, switch, textarea, avatar, tooltip, popover, command, form, alert-dialog)
- ✅ API client with types (`lib/api.ts`)
- ✅ React Query hooks (`lib/query.ts`)
- ✅ Dashboard layout with sidebar + auth guard
- ✅ Projects list page with create modal
- ✅ Project detail with tabs (Checks, Channels, API Keys, Settings)
- ✅ Check CRUD (create, edit, pause/resume, delete)
- ✅ Channel CRUD (create, edit, delete)
- ✅ API key management (create, copy, delete)
- ✅ Public status page (`/status/[slug]`)
- ✅ Forms converted to react-hook-form + zod
- ✅ Delete confirmations with AlertDialog
- ✅ Split project detail into tab components

### Phase 4.2 Additional Features (COMPLETED)
- [x] Assign channels to checks (CheckChannel relation)
- [x] View ping history for a check
- [x] Test channel button
- [x] Dashboard home with overview stats

---

## Phase 5: Production Readiness ✅ COMPLETED

### 5.1 Email Sender ✅
- SendPigeon integration (`lib/sendpigeon.ts`)
- Alert emails for DOWN/UP/STILL_DOWN
- Magic link emails for auth

### 5.2 Environment & Config ✅
- `env-var` for type-safe config with fail-fast
- `.env.example` files for api and web
- Required: `DATABASE_URL`, `AUTH_SECRET`
- Optional: OAuth, SendPigeon

### 5.3 Deployment
- Skip Docker - deploy to Railway/Render/Fly.io
- Health check at `/health`

### 5.4 Monitoring & Logging
- [x] Health check (`/health`)
- [ ] Structured logging (optional)
- [ ] Error tracking (optional)

---

## Phase 6: Billing ✅ COMPLETED

- Organizations with auto-creation on signup
- 14-day Pro trial for new orgs
- Tier limits: Free (10 checks, 2 projects) vs Pro (100 checks, unlimited)
- Stripe checkout + billing portal
- Webhook handling for subscription events
- Frontend: org switcher, billing page, upgrade prompts

---

## Phase 7: Enhanced Features ✅ MOSTLY COMPLETED

### 7.1 Team Management - PARTIAL
- [x] OrgMember model with roles (owner, admin, member)
- [ ] Invite members flow (email invite)
- [ ] Member list UI in settings

### 7.2 Enhanced Notifications ✅ COMPLETED
- [x] Slack App integration (OAuth, channel picker)
- [x] Discord webhooks
- [x] PagerDuty integration
- [x] Opsgenie integration

### 7.3 Analytics & Insights ✅ COMPLETED
- [x] CheckDailyStat model for uptime tracking
- [x] 90-day uptime history on status page
- [x] Stats API endpoint (`/v1/checks/:id/stats`)

### 7.4 Status Page Improvements ✅ MOSTLY COMPLETE
- [x] Custom domains (with DNS verification)
- [x] Scheduled maintenance (CRUD API)
- [x] Incidents with updates (CRUD API)
- [x] Frontend: Display incidents on status page
- [x] Frontend: Display maintenance on status page
- [ ] Frontend: Incidents/maintenance management UI (admin dashboard)

### 7.5 Infrastructure
- [ ] Deploy to Railway/Render/Fly.io
- [ ] Structured logging (optional)
- [ ] Error tracking (optional)

---

## Phase 8: Badge Embeds & TypeScript SDK ✅ COMPLETED

- [x] SVG badges (`/badge/{projectSlug}`, `/badge/{projectSlug}/{checkSlug}`)
- [x] TypeScript SDK (`haspulse` npm package)
- [x] SDK: timeout, retry, all endpoints
- [x] SDK: Full documentation
