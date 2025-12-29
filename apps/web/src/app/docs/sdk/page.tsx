import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "SDK Reference",
	description:
		"TypeScript SDK for HasPulse cron monitoring. Full API reference with code examples.",
	keywords: ["haspulse sdk", "typescript sdk", "cron monitoring api"],
}

export default function SdkPage() {
	return (
		<article className="docs-prose">
			<h1>SDK Reference</h1>

			<p className="lead">
				TypeScript SDK for HasPulse cron monitoring. Full type safety and
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
await client.ping('cron-job-id');

// Send a start signal
await client.ping('cron-job-id', { type: 'start' });

// Send a fail signal with output
await client.ping('cron-job-id', { type: 'fail', body: 'Error: connection failed' });`}</code>
			</pre>

			<h2>Configuration</h2>

			<pre>
				<code>{`const client = new HasPulse({
  apiKey: 'hp_...',
  baseUrl: 'https://api.haspulse.dev', // optional
  timeout: 30000,                      // optional, default 30s
  retries: 2,                          // optional, default 2 retries
});`}</code>
			</pre>

			<h2 id="pinging">Pinging</h2>

			<p>The core of HasPulse - notify us when your job runs.</p>

			<pre>
				<code>{`await client.ping('cron-job-id');                              // Success
await client.ping('cron-job-id', { type: 'start' });           // Job started
await client.ping('cron-job-id', { type: 'fail' });            // Job failed
await client.ping('cron-job-id', { type: 'fail', body: 'Error details' });`}</code>
			</pre>

			<h2 id="cron-jobs">Cron Jobs</h2>

			<pre>
				<code>{`// List all cron jobs in a project
const cronJobs = await client.cronJobs.list('project-id');

// Get a single cron job
const cronJob = await client.cronJobs.get('cron-job-id');

// Create a cron job
const cronJob = await client.cronJobs.create('project-id', {
  name: 'DB Backup',
  scheduleType: 'PERIOD',
  scheduleValue: '3600', // every hour
});

// Update a cron job
await client.cronJobs.update('cron-job-id', { name: 'New Name' });

// Pause/resume
await client.cronJobs.pause('cron-job-id');
await client.cronJobs.resume('cron-job-id');

// Delete
await client.cronJobs.delete('cron-job-id');

// Uptime stats (last 90 days)
const stats = await client.cronJobs.stats('cron-job-id', 90);`}</code>
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

			<h2>Organizations</h2>

			<pre>
				<code>{`const orgs = await client.organizations.list();
const org = await client.organizations.get('org-id');
const org = await client.organizations.create({ name: 'My Org', slug: 'my-org' });
await client.organizations.update('org-id', { name: 'New Name' });
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
  await client.cronJobs.get('invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Cron job not found');
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
  CronJob,
  MonitorStatus,
  Channel,
  ChannelType,
  Organization,
  Project,
} from 'haspulse';`}</code>
			</pre>
		</article>
	)
}
