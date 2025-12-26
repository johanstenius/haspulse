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
			"Learn how to monitor scheduled tasks in Node.js applications using the official HasPulse SDK or raw HTTP calls.",
		icon: "nodejs",
		keywords: [
			"node.js cron",
			"node-cron monitoring",
			"node-schedule",
			"javascript scheduled tasks",
			"haspulse sdk",
		],
		features: [
			"Official SDK with TypeScript support (npm install haspulse)",
			"Automatic start/success/fail with wrap() helper",
			"Works with node-cron, node-schedule, and setTimeout",
			"Zero-config retry and timeout handling",
		],
		relatedSlugs: ["typescript", "bash", "docker"],
		examples: [
			{
				language: "javascript",
				label: "SDK with wrap()",
				code: `import { HasPulse } from 'haspulse';
import cron from 'node-cron';

const haspulse = new HasPulse({
  apiKey: process.env.HASPULSE_API_KEY
});

// wrap() automatically sends start/success/fail
cron.schedule('*/5 * * * *', async () => {
  await haspulse.wrap('YOUR_CHECK_ID', async () => {
    await processQueue();
  });
});`,
			},
			{
				language: "javascript",
				label: "SDK manual ping",
				code: `import { HasPulse } from 'haspulse';

const haspulse = new HasPulse({
  apiKey: process.env.HASPULSE_API_KEY
});

// Manual control over lifecycle
await haspulse.ping('YOUR_CHECK_ID', { type: 'start' });

try {
  await processQueue();
  await haspulse.ping('YOUR_CHECK_ID'); // success
} catch (error) {
  await haspulse.ping('YOUR_CHECK_ID', { type: 'fail' });
  throw error;
}`,
			},
			{
				language: "javascript",
				label: "Raw HTTP (no SDK)",
				code: `// No dependencies needed - just fetch
cron.schedule('*/5 * * * *', async () => {
  await fetch('https://haspulse.dev/ping/YOUR_CHECK_ID/start');

  try {
    await processQueue();
    await fetch('https://haspulse.dev/ping/YOUR_CHECK_ID');
  } catch (error) {
    await fetch('https://haspulse.dev/ping/YOUR_CHECK_ID/fail');
    throw error;
  }
});`,
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
    check_url = "https://haspulse.dev/ping/YOUR_CHECK_ID"

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
    check_url = "https://haspulse.dev/ping/YOUR_CHECK_ID"

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
    url = f"https://haspulse.dev/ping/{check_id}"

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
        checkURL := "https://haspulse.dev/ping/YOUR_CHECK_ID"

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
    url := fmt.Sprintf("https://haspulse.dev/ping/%s", checkID)
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
			"Learn how to monitor Laravel's task scheduler and Artisan commands with HasPulse.",
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
        ->pingBefore('https://haspulse.dev/ping/YOUR_CHECK_ID/start')
        ->pingOnSuccess('https://haspulse.dev/ping/YOUR_CHECK_ID')
        ->pingOnFailure('https://haspulse.dev/ping/YOUR_CHECK_ID/fail');

    $schedule->command('queue:work --stop-when-empty')
        ->everyFiveMinutes()
        ->thenPing('https://haspulse.dev/ping/QUEUE_CHECK_ID');
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
        $checkUrl = 'https://haspulse.dev/ping/' . config('services.haspulse.check_id');

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
    check_url = "https://haspulse.dev/ping/\#{ENV['BACKUP_CHECK_ID']}"

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
    before: "curl -fsS https://haspulse.dev/ping/YOUR_CHECK_ID/start",
    after: "curl -fsS https://haspulse.dev/ping/YOUR_CHECK_ID"
end

every 5.minutes do
  command "rake queue:process && curl -fsS https://haspulse.dev/ping/QUEUE_CHECK_ID"
end`,
			},
		],
	},
	{
		slug: "bash",
		title: "Monitor Bash Cron Scripts",
		description:
			"Learn how to add HasPulse monitoring to shell scripts and system cron jobs.",
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
curl -fsS --retry 3 https://haspulse.dev/ping/YOUR_CHECK_ID

# With start signal
curl -fsS https://haspulse.dev/ping/YOUR_CHECK_ID/start
# ... your script logic ...
curl -fsS https://haspulse.dev/ping/YOUR_CHECK_ID`,
			},
			{
				language: "bash",
				label: "With error handling",
				code: `#!/bin/bash
CHECK_URL="https://haspulse.dev/ping/YOUR_CHECK_ID"

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
0 3 * * * /home/user/backup.sh && curl -fsS https://haspulse.dev/ping/BACKUP_ID

# Queue processor every 5 minutes
*/5 * * * * /home/user/process-queue.sh; curl -fsS https://haspulse.dev/ping/QUEUE_ID

# With full lifecycle
0 * * * * curl -fsS https://haspulse.dev/ping/HOURLY_ID/start && /home/user/hourly-job.sh && curl -fsS https://haspulse.dev/ping/HOURLY_ID || curl -fsS https://haspulse.dev/ping/HOURLY_ID/fail`,
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
CHECK_URL="https://haspulse.dev/ping/$CHECK_ID"
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
              curl -fsS "https://haspulse.dev/ping/$CHECK_ID/start"
              /app/backup.sh && \\
                curl -fsS "https://haspulse.dev/ping/$CHECK_ID" || \\
                curl -fsS "https://haspulse.dev/ping/$CHECK_ID/fail"
          restartPolicy: OnFailure`,
			},
		],
	},
	{
		slug: "php",
		title: "Monitor PHP Cron Scripts",
		description:
			"Learn how to monitor PHP scheduled tasks and cron scripts with HasPulse.",
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
$checkUrl = 'https://haspulse.dev/ping/' . getenv('CHECK_ID');

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
    $url = "https://haspulse.dev/ping/{$checkId}";
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
			"Learn how to monitor TypeScript scheduled tasks with full type safety using the official HasPulse SDK.",
		icon: "typescript",
		keywords: [
			"typescript cron",
			"ts cron monitoring",
			"type-safe monitoring",
			"haspulse sdk",
		],
		features: [
			"Full TypeScript support with exported types",
			"Built-in wrap() helper for automatic lifecycle",
			"Zero-config retry and timeout handling",
			"Works with all Node.js schedulers",
		],
		relatedSlugs: ["node-js", "docker", "bash"],
		examples: [
			{
				language: "typescript",
				label: "SDK with wrap()",
				code: `import { HasPulse } from 'haspulse';
import cron from 'node-cron';

const haspulse = new HasPulse({
  apiKey: process.env.HASPULSE_API_KEY!
});

// wrap() automatically sends start/success/fail
cron.schedule('*/5 * * * *', async () => {
  await haspulse.wrap('YOUR_CHECK_ID', async () => {
    await processQueue();
  });
});`,
			},
			{
				language: "typescript",
				label: "SDK manual ping",
				code: `import { HasPulse, type PingOptions } from 'haspulse';

const haspulse = new HasPulse({
  apiKey: process.env.HASPULSE_API_KEY!
});

// Full control with type-safe options
await haspulse.ping('YOUR_CHECK_ID', { type: 'start' });

try {
  const result = await processQueue();
  await haspulse.ping('YOUR_CHECK_ID'); // success
  return result;
} catch (error) {
  await haspulse.ping('YOUR_CHECK_ID', { type: 'fail' });
  throw error;
}`,
			},
		],
	},
]

export const alertChannels: AlertChannel[] = [
	{
		slug: "slack",
		title: "Set Up Slack Alerts",
		description:
			"Learn how to receive HasPulse alerts in Slack via webhook or the official Slack app.",
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
			"Go to your HasPulse project settings",
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
			"Learn how to receive HasPulse alerts in Discord channels via webhooks.",
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
			"In HasPulse, go to project settings and click 'Add Channel'",
			"Select Discord and paste your webhook URL",
			"Choose which checks should alert to this channel",
		],
	},
	{
		slug: "pagerduty",
		title: "Set Up PagerDuty Alerts",
		description:
			"Learn how to send HasPulse alerts to PagerDuty for on-call incident management.",
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
			"In HasPulse, add a PagerDuty channel with the routing key",
			"Configure severity levels for DOWN/LATE states",
		],
	},
	{
		slug: "email",
		title: "Set Up Email Alerts",
		description:
			"Learn how to configure email notifications for HasPulse alerts.",
		icon: "email",
		keywords: ["email alerts", "email notifications", "smtp alerts"],
		features: [
			"Multiple email recipients",
			"HTML and plain text emails",
			"Customizable subject lines",
			"Digest mode (batch alerts)",
		],
		setupSteps: [
			"In HasPulse project settings, click 'Add Channel'",
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
			"Learn how to send HasPulse alerts to custom webhook endpoints.",
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
			"In HasPulse, add a Webhook channel",
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
