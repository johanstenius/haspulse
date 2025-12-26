# @haspulse/sdk

TypeScript SDK for HasPulse cron monitoring.

## Installation

```bash
npm install @haspulse/sdk
```

## Quick Start

```typescript
import { HasPulse } from "@haspulse/sdk"

const client = new HasPulse({ apiKey: "hp_..." })

// Wrap your cron job - automatically tracks start/success/fail
await client.wrap("check-id", async () => {
  await myDatabaseBackup()
})
```

## Usage

### Wrapping Jobs (Recommended)

The `wrap()` method automatically sends start/success/fail signals:

```typescript
await client.wrap("check-id", async () => {
  // Your job logic here
  await syncUsers()
  await sendReports()
})
// Sends "start" → runs function → sends "success" (or "fail" if error thrown)
```

### Manual Pinging

For more control, use `ping()` directly:

```typescript
await client.ping("check-id")                              // Success
await client.ping("check-id", { type: "start" })           // Job started
await client.ping("check-id", { type: "fail" })            // Job failed
await client.ping("check-id", { type: "fail", body: "Error details" })
```

## Configuration

```typescript
const client = new HasPulse({
  apiKey: "hp_...",
  timeout: 30000, // optional, default 30s
  retries: 2,     // optional, default 2 retries with exponential backoff
})
```

### Development Mode (No-op)

When `apiKey` is undefined, `ping()` and `wrap()` silently no-op. This allows running in development without setting up monitoring:

```typescript
const client = new HasPulse({ apiKey: process.env.HASPULSE_API_KEY })

// Works in dev (no-op) and prod (sends pings)
await client.wrap("check-id", async () => {
  await myJob()
})
```

Management APIs (projects, checks, etc.) still require an API key and will throw if accessed without one.

## API Reference

### Projects

```typescript
const projects = await client.projects.list()
const project = await client.projects.get("project-id")
const project = await client.projects.create({ name: "My Project", slug: "my-project", orgId: "org-id" })
await client.projects.update("project-id", { name: "New Name" })
await client.projects.delete("project-id")
```

### Checks

```typescript
const checks = await client.checks.list("project-id")
const check = await client.checks.get("check-id")
const check = await client.checks.create("project-id", {
  name: "DB Backup",
  scheduleType: "PERIOD",
  scheduleValue: "3600", // every hour
})
await client.checks.update("check-id", { name: "New Name" })
await client.checks.pause("check-id")
await client.checks.resume("check-id")
await client.checks.delete("check-id")

// Uptime stats
const stats = await client.checks.stats("check-id", 90) // last 90 days
```

### Channels (Notifications)

```typescript
const channels = await client.channels.list("project-id")
const channel = await client.channels.create("project-id", {
  type: "SLACK_WEBHOOK",
  name: "Slack Alerts",
  config: { webhookUrl: "https://hooks.slack.com/..." },
})
await client.channels.update("project-id", "channel-id", { name: "New Name" })
await client.channels.test("project-id", "channel-id") // Test notification
await client.channels.delete("project-id", "channel-id")
```

### Incidents

```typescript
const incidents = await client.incidents.list("project-id")
const incidents = await client.incidents.list("project-id", { status: "INVESTIGATING" })

const incident = await client.incidents.create("project-id", {
  title: "API Degradation",
  impact: "MINOR",
})

await client.incidents.update("project-id", "incident-id", { status: "IDENTIFIED" })

// Add status update
await client.incidents.addUpdate("project-id", "incident-id", {
  status: "MONITORING",
  message: "Fix deployed, monitoring for stability",
})

await client.incidents.delete("project-id", "incident-id")
```

### Maintenance Windows

```typescript
const windows = await client.maintenance.list("project-id")
const windows = await client.maintenance.list("project-id", { upcoming: true })

const maintenance = await client.maintenance.create("project-id", {
  title: "Database Migration",
  startsAt: "2024-01-15T03:00:00Z",
  endsAt: "2024-01-15T05:00:00Z",
  checkIds: ["check-1", "check-2"],
})

await client.maintenance.update("project-id", "maintenance-id", { title: "Updated Title" })
await client.maintenance.delete("project-id", "maintenance-id")
```

### Organizations

```typescript
const orgs = await client.organizations.list()
const org = await client.organizations.get("org-id")
const org = await client.organizations.create({ name: "My Org", slug: "my-org" })
await client.organizations.update("org-id", { autoCreateIncidents: true })
await client.organizations.delete("org-id")
```

### API Keys

```typescript
const keys = await client.apiKeys.list("project-id")
const newKey = await client.apiKeys.create("project-id", { name: "CI/CD" })
console.log(newKey.key) // Full key shown only once
await client.apiKeys.delete("project-id", "key-id")
```

## Error Handling

```typescript
import { HasPulseError, NotFoundError, UnauthorizedError } from "@haspulse/sdk"

try {
  await client.checks.get("invalid-id")
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log("Check not found")
  } else if (error instanceof UnauthorizedError) {
    console.log("Invalid API key")
  } else if (error instanceof HasPulseError) {
    console.log(`Error: ${error.message} (${error.code})`)
  }
}
```

## Types

All types are exported for TypeScript users:

```typescript
import type {
  Check,
  CheckStatus,
  Channel,
  ChannelType,
  Incident,
  IncidentStatus,
  Maintenance,
  Organization,
  Project,
} from "@haspulse/sdk"
```

## License

MIT
