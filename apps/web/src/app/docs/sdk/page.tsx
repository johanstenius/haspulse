import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "SDK Reference",
	description:
		"TypeScript SDK for Haspulse cron monitoring. Full API reference with code examples.",
	keywords: ["haspulse sdk", "typescript sdk", "cron monitoring api"],
}

export default function SdkPage() {
	return (
		<article className="docs-prose">
			<h1>SDK Reference</h1>

			<p className="lead">
				TypeScript SDK for Haspulse cron monitoring. Full type safety and
				auto-completion.
			</p>

			<h2>Installation</h2>

			<pre>
				<code>npm install haspulse</code>
			</pre>

			<h2>Quick Start</h2>

			<pre>
				<code>{`import { HasPulse } from 'haspulse';

const client = new HasPulse({ apiKey: 'hp_...' });

// Send a ping
await client.ping('check-id');

// Send a start signal
await client.ping('check-id', { type: 'start' });

// Send a fail signal with output
await client.ping('check-id', { type: 'fail', body: 'Error: connection failed' });`}</code>
			</pre>

			<h2>Configuration</h2>

			<pre>
				<code>{`const client = new HasPulse({
  apiKey: 'hp_...',
  baseUrl: 'https://api.haspulse.io', // optional
  timeout: 30000,                      // optional, default 30s
  retries: 2,                          // optional, default 2 retries
});`}</code>
			</pre>

			<h2 id="pinging">Pinging</h2>

			<p>The core of Haspulse - notify us when your job runs.</p>

			<pre>
				<code>{`await client.ping('check-id');                              // Success
await client.ping('check-id', { type: 'start' });           // Job started
await client.ping('check-id', { type: 'fail' });            // Job failed
await client.ping('check-id', { type: 'fail', body: 'Error details' });`}</code>
			</pre>

			<h2 id="checks">Checks</h2>

			<pre>
				<code>{`// List all checks in a project
const checks = await client.checks.list('project-id');

// Get a single check
const check = await client.checks.get('check-id');

// Create a check
const check = await client.checks.create('project-id', {
  name: 'DB Backup',
  scheduleType: 'PERIOD',
  scheduleValue: '3600', // every hour
});

// Update a check
await client.checks.update('check-id', { name: 'New Name' });

// Pause/resume
await client.checks.pause('check-id');
await client.checks.resume('check-id');

// Delete
await client.checks.delete('check-id');

// Uptime stats (last 90 days)
const stats = await client.checks.stats('check-id', 90);`}</code>
			</pre>

			<h2 id="channels">Channels (Notifications)</h2>

			<pre>
				<code>{`// List channels
const channels = await client.channels.list('project-id');

// Create a Slack channel
const channel = await client.channels.create('project-id', {
  type: 'SLACK_WEBHOOK',
  name: 'Slack Alerts',
  config: { webhookUrl: 'https://hooks.slack.com/...' },
});

// Update
await client.channels.update('project-id', 'channel-id', { name: 'New Name' });

// Test notification
await client.channels.test('project-id', 'channel-id');

// Delete
await client.channels.delete('project-id', 'channel-id');`}</code>
			</pre>

			<h2>Incidents</h2>

			<pre>
				<code>{`// List incidents
const incidents = await client.incidents.list('project-id');
const incidents = await client.incidents.list('project-id', { status: 'INVESTIGATING' });

// Create incident
const incident = await client.incidents.create('project-id', {
  title: 'API Degradation',
  impact: 'MINOR',
});

// Update status
await client.incidents.update('project-id', 'incident-id', { status: 'IDENTIFIED' });

// Add status update
await client.incidents.addUpdate('project-id', 'incident-id', {
  status: 'MONITORING',
  message: 'Fix deployed, monitoring for stability',
});

// Delete
await client.incidents.delete('project-id', 'incident-id');`}</code>
			</pre>

			<h2>Maintenance Windows</h2>

			<pre>
				<code>{`// List windows
const windows = await client.maintenance.list('project-id');
const windows = await client.maintenance.list('project-id', { upcoming: true });

// Create maintenance window
const maintenance = await client.maintenance.create('project-id', {
  title: 'Database Migration',
  startsAt: '2024-01-15T03:00:00Z',
  endsAt: '2024-01-15T05:00:00Z',
  checkIds: ['check-1', 'check-2'],
});

// Update
await client.maintenance.update('project-id', 'maintenance-id', { title: 'Updated' });

// Delete
await client.maintenance.delete('project-id', 'maintenance-id');`}</code>
			</pre>

			<h2>Organizations</h2>

			<pre>
				<code>{`const orgs = await client.organizations.list();
const org = await client.organizations.get('org-id');
const org = await client.organizations.create({ name: 'My Org', slug: 'my-org' });
await client.organizations.update('org-id', { autoCreateIncidents: true });
await client.organizations.delete('org-id');`}</code>
			</pre>

			<h2>API Keys</h2>

			<pre>
				<code>{`const keys = await client.apiKeys.list('project-id');
const newKey = await client.apiKeys.create('project-id', { name: 'CI/CD' });
console.log(newKey.key); // Full key shown only once
await client.apiKeys.delete('project-id', 'key-id');`}</code>
			</pre>

			<h2 id="errors">Error Handling</h2>

			<pre>
				<code>{`import { HasPulseError, NotFoundError, UnauthorizedError } from 'haspulse';

try {
  await client.checks.get('invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Check not found');
  } else if (error instanceof UnauthorizedError) {
    console.log('Invalid API key');
  } else if (error instanceof HasPulseError) {
    console.log(\`Error: \${error.message} (\${error.code})\`);
  }
}`}</code>
			</pre>

			<h2>TypeScript Types</h2>

			<p>All types are exported for TypeScript users:</p>

			<pre>
				<code>{`import type {
  Check,
  CheckStatus,
  Channel,
  ChannelType,
  Incident,
  IncidentStatus,
  Maintenance,
  Organization,
  Project,
} from 'haspulse';`}</code>
			</pre>
		</article>
	)
}
