export type CodeExample = {
	language: string
	label: string
	code: string
}

export type Integration = {
	slug: string
	title: string
	description: string
	icon: string
	keywords: string[]
	examples: CodeExample[]
	features: string[]
	relatedSlugs: string[]
}

export type AlertChannel = {
	slug: string
	title: string
	description: string
	icon: string
	keywords: string[]
	setupSteps: string[]
	features: string[]
}

export const integrations: Integration[] = [
	{
		slug: "node-js",
		title: "Monitor Node.js Cron Jobs",
		description:
			"Learn how to monitor scheduled tasks in Node.js applications using node-cron, node-schedule, or the built-in timers.",
		icon: "nodejs",
		keywords: [
			"node.js cron",
			"node-cron monitoring",
			"node-schedule",
			"javascript scheduled tasks",
		],
		features: [
			"Works with node-cron, node-schedule, and setTimeout",
			"Supports start/success/fail lifecycle signals",
			"Async/await compatible",
			"Zero dependencies with fetch API",
		],
		relatedSlugs: ["typescript", "bash", "docker"],
		examples: [
			{
				language: "javascript",
				label: "node-cron",
				code: `import cron from 'node-cron';

// Schedule task to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  // Signal start
  await fetch('https://haspulse.io/ping/YOUR_CHECK_ID/start');

  try {
    // Your job logic here
    await processQueue();

    // Signal success
    await fetch('https://haspulse.io/ping/YOUR_CHECK_ID');
  } catch (error) {
    // Signal failure
    await fetch('https://haspulse.io/ping/YOUR_CHECK_ID/fail');
    throw error;
  }
});`,
			},
			{
				language: "javascript",
				label: "node-schedule",
				code: `import schedule from 'node-schedule';

// Run every day at 3 AM
const job = schedule.scheduleJob('0 3 * * *', async () => {
  try {
    await runDailyBackup();

    // Ping on success
    await fetch('https://haspulse.io/ping/YOUR_CHECK_ID');
  } catch (error) {
    await fetch('https://haspulse.io/ping/YOUR_CHECK_ID/fail');
  }
});`,
			},
			{
				language: "javascript",
				label: "Simple fetch",
				code: `// Add to end of any scheduled script
async function pingHaspulse(checkId, status = '') {
  const url = \`https://haspulse.io/ping/\${checkId}\${status ? '/' + status : ''}\`;
  await fetch(url, { method: 'GET' });
}

// Usage
await pingHaspulse('YOUR_CHECK_ID');         // Success
await pingHaspulse('YOUR_CHECK_ID', 'start'); // Started
await pingHaspulse('YOUR_CHECK_ID', 'fail');  // Failed`,
			},
		],
	},
	{
		slug: "python",
		title: "Monitor Python Scheduled Tasks",
		description:
			"Learn how to monitor cron jobs and scheduled tasks in Python using APScheduler, Celery Beat, or system cron.",
		icon: "python",
		keywords: [
			"python cron",
			"apscheduler monitoring",
			"celery beat",
			"python scheduled tasks",
		],
		features: [
			"Works with APScheduler, Celery, and system cron",
			"Supports context managers for clean lifecycle tracking",
			"Requests and httpx compatible",
			"Django and Flask integration examples",
		],
		relatedSlugs: ["bash", "docker", "node-js"],
		examples: [
			{
				language: "python",
				label: "APScheduler",
				code: `from apscheduler.schedulers.blocking import BlockingScheduler
import requests

def backup_database():
    check_url = "https://haspulse.io/ping/YOUR_CHECK_ID"

    # Signal start
    requests.get(f"{check_url}/start")

    try:
        # Your backup logic
        run_backup()

        # Signal success
        requests.get(check_url)
    except Exception as e:
        # Signal failure
        requests.get(f"{check_url}/fail")
        raise

scheduler = BlockingScheduler()
scheduler.add_job(backup_database, 'cron', hour=3)
scheduler.start()`,
			},
			{
				language: "python",
				label: "Celery Beat",
				code: `from celery import Celery
import requests

app = Celery('tasks')

@app.task
def process_queue():
    check_url = "https://haspulse.io/ping/YOUR_CHECK_ID"

    try:
        # Your task logic
        result = do_work()

        # Ping on success
        requests.get(check_url)
        return result
    except Exception:
        requests.get(f"{check_url}/fail")
        raise

# In celerybeat schedule:
# 'process-queue': {
#     'task': 'tasks.process_queue',
#     'schedule': crontab(minute='*/5'),
# }`,
			},
			{
				language: "python",
				label: "Context Manager",
				code: `import requests
from contextlib import contextmanager

@contextmanager
def haspulse_monitor(check_id):
    """Context manager for monitoring jobs."""
    url = f"https://haspulse.io/ping/{check_id}"

    requests.get(f"{url}/start")
    try:
        yield
        requests.get(url)
    except Exception:
        requests.get(f"{url}/fail")
        raise

# Usage
with haspulse_monitor("YOUR_CHECK_ID"):
    run_my_scheduled_task()`,
			},
		],
	},
	{
		slug: "go",
		title: "Monitor Go Cron Jobs",
		description:
			"Learn how to monitor scheduled tasks in Go applications using robfig/cron or the standard library.",
		icon: "go",
		keywords: [
			"go cron",
			"golang cron monitoring",
			"robfig/cron",
			"go scheduled tasks",
		],
		features: [
			"Works with robfig/cron and standard library",
			"Goroutine-safe monitoring",
			"HTTP client with retries",
			"Minimal dependencies",
		],
		relatedSlugs: ["docker", "bash", "node-js"],
		examples: [
			{
				language: "go",
				label: "robfig/cron",
				code: `package main

import (
    "net/http"
    "github.com/robfig/cron/v3"
)

func main() {
    c := cron.New()

    c.AddFunc("*/5 * * * *", func() {
        checkURL := "https://haspulse.io/ping/YOUR_CHECK_ID"

        // Signal start
        http.Get(checkURL + "/start")

        err := processQueue()
        if err != nil {
            http.Get(checkURL + "/fail")
            return
        }

        // Signal success
        http.Get(checkURL)
    })

    c.Start()
    select {}
}`,
			},
			{
				language: "go",
				label: "Helper function",
				code: `package monitor

import (
    "fmt"
    "net/http"
    "time"
)

var client = &http.Client{Timeout: 10 * time.Second}

func Ping(checkID string, status string) error {
    url := fmt.Sprintf("https://haspulse.io/ping/%s", checkID)
    if status != "" {
        url += "/" + status
    }

    resp, err := client.Get(url)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    return nil
}

// Usage:
// monitor.Ping("YOUR_CHECK_ID", "start")
// monitor.Ping("YOUR_CHECK_ID", "")      // success
// monitor.Ping("YOUR_CHECK_ID", "fail")`,
			},
		],
	},
	{
		slug: "laravel",
		title: "Monitor Laravel Scheduler",
		description:
			"Learn how to monitor Laravel's task scheduler and Artisan commands with Haspulse.",
		icon: "laravel",
		keywords: [
			"laravel scheduler",
			"artisan cron",
			"laravel cron monitoring",
			"php scheduled tasks",
		],
		features: [
			"Native Laravel scheduler integration",
			"Artisan command monitoring",
			"Queue job monitoring",
			"Works with Laravel Horizon",
		],
		relatedSlugs: ["php", "docker", "bash"],
		examples: [
			{
				language: "php",
				label: "Kernel.php",
				code: `// app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    $schedule->command('backup:run')
        ->daily()
        ->at('03:00')
        ->pingBefore('https://haspulse.io/ping/YOUR_CHECK_ID/start')
        ->pingOnSuccess('https://haspulse.io/ping/YOUR_CHECK_ID')
        ->pingOnFailure('https://haspulse.io/ping/YOUR_CHECK_ID/fail');

    $schedule->command('queue:work --stop-when-empty')
        ->everyFiveMinutes()
        ->thenPing('https://haspulse.io/ping/QUEUE_CHECK_ID');
}`,
			},
			{
				language: "php",
				label: "Artisan Command",
				code: `// app/Console/Commands/ProcessReports.php
class ProcessReports extends Command
{
    protected $signature = 'reports:process';

    public function handle()
    {
        $checkUrl = 'https://haspulse.io/ping/' . config('services.haspulse.check_id');

        Http::get($checkUrl . '/start');

        try {
            $this->processReports();
            Http::get($checkUrl);
            return Command::SUCCESS;
        } catch (\\Exception $e) {
            Http::get($checkUrl . '/fail');
            throw $e;
        }
    }
}`,
			},
		],
	},
	{
		slug: "rails",
		title: "Monitor Ruby on Rails Jobs",
		description:
			"Learn how to monitor Rails background jobs with Sidekiq, whenever gem, or ActiveJob.",
		icon: "rails",
		keywords: [
			"rails cron",
			"sidekiq monitoring",
			"whenever gem",
			"ruby scheduled tasks",
		],
		features: [
			"Works with Sidekiq, Resque, and DelayedJob",
			"Whenever gem integration",
			"ActiveJob lifecycle callbacks",
			"Sidekiq Pro batch monitoring",
		],
		relatedSlugs: ["docker", "bash", "node-js"],
		examples: [
			{
				language: "ruby",
				label: "Sidekiq Worker",
				code: `class BackupWorker
  include Sidekiq::Worker

  def perform
    check_url = "https://haspulse.io/ping/\#{ENV['BACKUP_CHECK_ID']}"

    # Signal start
    Net::HTTP.get(URI("\#{check_url}/start"))

    begin
      DatabaseBackup.run
      Net::HTTP.get(URI(check_url))
    rescue => e
      Net::HTTP.get(URI("\#{check_url}/fail"))
      raise
    end
  end
end

# Schedule with sidekiq-cron:
# Sidekiq::Cron::Job.create(
#   name: 'Backup - daily at 3am',
#   cron: '0 3 * * *',
#   class: 'BackupWorker'
# )`,
			},
			{
				language: "ruby",
				label: "whenever gem",
				code: `# config/schedule.rb
set :output, '/var/log/cron.log'

every 1.day, at: '3:00 am' do
  rake "db:backup",
    before: "curl -fsS https://haspulse.io/ping/YOUR_CHECK_ID/start",
    after: "curl -fsS https://haspulse.io/ping/YOUR_CHECK_ID"
end

every 5.minutes do
  command "rake queue:process && curl -fsS https://haspulse.io/ping/QUEUE_CHECK_ID"
end`,
			},
		],
	},
	{
		slug: "bash",
		title: "Monitor Bash Cron Scripts",
		description:
			"Learn how to add Haspulse monitoring to shell scripts and system cron jobs.",
		icon: "terminal",
		keywords: [
			"bash cron",
			"shell script monitoring",
			"crontab monitoring",
			"linux cron",
		],
		features: [
			"Single curl command integration",
			"Works with any shell (bash, zsh, sh)",
			"Supports exit code detection",
			"Retry with exponential backoff",
		],
		relatedSlugs: ["docker", "node-js", "python"],
		examples: [
			{
				language: "bash",
				label: "Basic ping",
				code: `#!/bin/bash
# Add to end of any cron script

# Simple ping on success
curl -fsS --retry 3 https://haspulse.io/ping/YOUR_CHECK_ID

# With start signal
curl -fsS https://haspulse.io/ping/YOUR_CHECK_ID/start
# ... your script logic ...
curl -fsS https://haspulse.io/ping/YOUR_CHECK_ID`,
			},
			{
				language: "bash",
				label: "With error handling",
				code: `#!/bin/bash
CHECK_URL="https://haspulse.io/ping/YOUR_CHECK_ID"

# Signal start
curl -fsS "$CHECK_URL/start"

# Run your job and capture exit code
/path/to/your/backup-script.sh
EXIT_CODE=$?

# Ping based on result
if [ $EXIT_CODE -eq 0 ]; then
    curl -fsS "$CHECK_URL"
else
    curl -fsS "$CHECK_URL/fail"
fi

exit $EXIT_CODE`,
			},
			{
				language: "bash",
				label: "Crontab entry",
				code: `# Edit with: crontab -e

# Database backup at 3 AM daily
0 3 * * * /home/user/backup.sh && curl -fsS https://haspulse.io/ping/BACKUP_ID

# Queue processor every 5 minutes
*/5 * * * * /home/user/process-queue.sh; curl -fsS https://haspulse.io/ping/QUEUE_ID

# With full lifecycle
0 * * * * curl -fsS https://haspulse.io/ping/HOURLY_ID/start && /home/user/hourly-job.sh && curl -fsS https://haspulse.io/ping/HOURLY_ID || curl -fsS https://haspulse.io/ping/HOURLY_ID/fail`,
			},
		],
	},
	{
		slug: "docker",
		title: "Monitor Docker Cron Containers",
		description:
			"Learn how to monitor scheduled tasks running in Docker containers and Kubernetes CronJobs.",
		icon: "docker",
		keywords: [
			"docker cron",
			"kubernetes cronjob",
			"container monitoring",
			"docker scheduled tasks",
		],
		features: [
			"Works with Docker Compose and Kubernetes",
			"Health check endpoint integration",
			"Sidecar container pattern",
			"Init container monitoring",
		],
		relatedSlugs: ["bash", "node-js", "go"],
		examples: [
			{
				language: "dockerfile",
				label: "Dockerfile",
				code: `FROM alpine:latest

RUN apk add --no-cache curl bash

COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh

# Wrapper script with monitoring
COPY <<'EOF' /app/run.sh
#!/bin/bash
CHECK_URL="https://haspulse.io/ping/$CHECK_ID"
curl -fsS "$CHECK_URL/start"
/app/backup.sh
if [ $? -eq 0 ]; then
    curl -fsS "$CHECK_URL"
else
    curl -fsS "$CHECK_URL/fail"
fi
EOF
RUN chmod +x /app/run.sh

CMD ["/app/run.sh"]`,
			},
			{
				language: "yaml",
				label: "docker-compose.yml",
				code: `version: '3.8'
services:
  backup:
    build: .
    environment:
      - CHECK_ID=YOUR_CHECK_ID
    # Run daily at 3 AM using ofelia or supercronic
    labels:
      ofelia.enabled: "true"
      ofelia.job-exec.backup.schedule: "0 3 * * *"
      ofelia.job-exec.backup.command: "/app/run.sh"`,
			},
			{
				language: "yaml",
				label: "Kubernetes CronJob",
				code: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: your-backup-image
            env:
            - name: CHECK_ID
              valueFrom:
                secretKeyRef:
                  name: haspulse
                  key: check-id
            command:
            - /bin/sh
            - -c
            - |
              curl -fsS "https://haspulse.io/ping/$CHECK_ID/start"
              /app/backup.sh && \\
                curl -fsS "https://haspulse.io/ping/$CHECK_ID" || \\
                curl -fsS "https://haspulse.io/ping/$CHECK_ID/fail"
          restartPolicy: OnFailure`,
			},
		],
	},
	{
		slug: "php",
		title: "Monitor PHP Cron Scripts",
		description:
			"Learn how to monitor PHP scheduled tasks and cron scripts with Haspulse.",
		icon: "php",
		keywords: [
			"php cron",
			"php monitoring",
			"php scheduled tasks",
			"wordpress cron",
		],
		features: [
			"Works with vanilla PHP and frameworks",
			"cURL and file_get_contents support",
			"WordPress wp-cron integration",
			"Composer package available",
		],
		relatedSlugs: ["laravel", "bash", "docker"],
		examples: [
			{
				language: "php",
				label: "Basic PHP",
				code: `<?php
$checkUrl = 'https://haspulse.io/ping/' . getenv('CHECK_ID');

// Signal start
file_get_contents($checkUrl . '/start');

try {
    // Your job logic
    processData();

    // Signal success
    file_get_contents($checkUrl);
} catch (Exception $e) {
    // Signal failure
    file_get_contents($checkUrl . '/fail');
    throw $e;
}`,
			},
			{
				language: "php",
				label: "With cURL",
				code: `<?php
function pingHaspulse(string $checkId, string $status = ''): void {
    $url = "https://haspulse.io/ping/{$checkId}";
    if ($status) {
        $url .= "/{$status}";
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    curl_exec($ch);
    curl_close($ch);
}

// Usage
pingHaspulse('YOUR_CHECK_ID', 'start');
// ... run job ...
pingHaspulse('YOUR_CHECK_ID');`,
			},
		],
	},
	{
		slug: "typescript",
		title: "Monitor TypeScript Cron Jobs",
		description:
			"Learn how to monitor TypeScript scheduled tasks with full type safety using the Haspulse SDK.",
		icon: "typescript",
		keywords: ["typescript cron", "ts cron monitoring", "type-safe monitoring"],
		features: [
			"Full TypeScript support with types",
			"Official SDK available (npm install haspulse)",
			"Works with all Node.js schedulers",
			"Async/await compatible",
		],
		relatedSlugs: ["node-js", "docker", "bash"],
		examples: [
			{
				language: "typescript",
				label: "With SDK",
				code: `import { Haspulse } from 'haspulse';
import cron from 'node-cron';

const haspulse = new Haspulse({ apiKey: process.env.HASPULSE_API_KEY });

cron.schedule('*/5 * * * *', async () => {
  await haspulse.ping('YOUR_CHECK_ID', { status: 'start' });

  try {
    await processQueue();
    await haspulse.ping('YOUR_CHECK_ID');
  } catch (error) {
    await haspulse.ping('YOUR_CHECK_ID', { status: 'fail' });
    throw error;
  }
});`,
			},
			{
				language: "typescript",
				label: "Custom wrapper",
				code: `type PingStatus = 'start' | 'fail' | '';

async function pingHaspulse(
  checkId: string,
  status: PingStatus = ''
): Promise<void> {
  const url = \`https://haspulse.io/ping/\${checkId}\${status ? '/' + status : ''}\`;
  await fetch(url);
}

// Type-safe wrapper
async function withMonitoring<T>(
  checkId: string,
  fn: () => Promise<T>
): Promise<T> {
  await pingHaspulse(checkId, 'start');
  try {
    const result = await fn();
    await pingHaspulse(checkId);
    return result;
  } catch (error) {
    await pingHaspulse(checkId, 'fail');
    throw error;
  }
}

// Usage
await withMonitoring('YOUR_CHECK_ID', async () => {
  return await myScheduledTask();
});`,
			},
		],
	},
]

export const alertChannels: AlertChannel[] = [
	{
		slug: "slack",
		title: "Set Up Slack Alerts",
		description:
			"Learn how to receive Haspulse alerts in Slack via webhook or the official Slack app.",
		icon: "slack",
		keywords: [
			"slack alerts",
			"slack webhook",
			"slack notifications",
			"slack integration",
		],
		features: [
			"Incoming webhook support",
			"Official Slack app with rich messages",
			"Channel-specific routing",
			"Recovery notifications",
		],
		setupSteps: [
			"Go to your Haspulse project settings",
			"Click 'Add Channel' and select Slack",
			"Choose webhook or OAuth app method",
			"For webhook: Create incoming webhook in Slack and paste URL",
			"For OAuth: Click 'Connect to Slack' and authorize",
			"Select which checks should alert to this channel",
		],
	},
	{
		slug: "discord",
		title: "Set Up Discord Alerts",
		description:
			"Learn how to receive Haspulse alerts in Discord channels via webhooks.",
		icon: "discord",
		keywords: ["discord alerts", "discord webhook", "discord notifications"],
		features: [
			"Discord webhook integration",
			"Rich embed messages",
			"Channel-specific routing",
			"Color-coded by severity",
		],
		setupSteps: [
			"In Discord, go to Server Settings > Integrations > Webhooks",
			"Click 'New Webhook' and copy the webhook URL",
			"In Haspulse, go to project settings and click 'Add Channel'",
			"Select Discord and paste your webhook URL",
			"Choose which checks should alert to this channel",
		],
	},
	{
		slug: "pagerduty",
		title: "Set Up PagerDuty Alerts",
		description:
			"Learn how to send Haspulse alerts to PagerDuty for on-call incident management.",
		icon: "pagerduty",
		keywords: [
			"pagerduty alerts",
			"pagerduty integration",
			"incident management",
		],
		features: [
			"PagerDuty Events API v2 integration",
			"Automatic incident creation",
			"Auto-resolve on recovery",
			"Severity mapping",
		],
		setupSteps: [
			"In PagerDuty, create a new service or use existing",
			"Add an integration and select 'Events API v2'",
			"Copy the Integration Key (routing key)",
			"In Haspulse, add a PagerDuty channel with the routing key",
			"Configure severity levels for DOWN/LATE states",
		],
	},
	{
		slug: "email",
		title: "Set Up Email Alerts",
		description:
			"Learn how to configure email notifications for Haspulse alerts.",
		icon: "email",
		keywords: ["email alerts", "email notifications", "smtp alerts"],
		features: [
			"Multiple email recipients",
			"HTML and plain text emails",
			"Customizable subject lines",
			"Digest mode (batch alerts)",
		],
		setupSteps: [
			"In Haspulse project settings, click 'Add Channel'",
			"Select Email as the channel type",
			"Enter one or more email addresses",
			"Optionally enable digest mode to batch alerts",
			"Select which checks should send email alerts",
		],
	},
	{
		slug: "webhook",
		title: "Set Up Webhook Alerts",
		description:
			"Learn how to send Haspulse alerts to custom webhook endpoints.",
		icon: "webhook",
		keywords: ["webhook alerts", "custom webhook", "api integration"],
		features: [
			"POST requests with JSON payload",
			"Custom headers support",
			"HMAC signature verification",
			"Retry with exponential backoff",
		],
		setupSteps: [
			"Create an HTTP endpoint to receive POST requests",
			"In Haspulse, add a Webhook channel",
			"Enter your endpoint URL",
			"Optionally add custom headers (e.g., Authorization)",
			"Copy the signing secret for payload verification",
		],
	},
]

export function getIntegrationBySlug(slug: string): Integration | undefined {
	return integrations.find((i) => i.slug === slug)
}

export function getAlertChannelBySlug(slug: string): AlertChannel | undefined {
	return alertChannels.find((c) => c.slug === slug)
}
