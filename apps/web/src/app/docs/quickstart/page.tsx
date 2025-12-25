import { CodeBlock } from "@/components/docs/code-block"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "Quickstart",
	description:
		"Get started with Haspulse cron monitoring in 5 minutes. Create your first check and start receiving alerts.",
	keywords: ["haspulse quickstart", "cron monitoring setup", "getting started"],
}

export default function QuickstartPage() {
	return (
		<article className="docs-prose">
			<h1>Quickstart</h1>

			<p className="lead">
				Start monitoring your first cron job in under 5 minutes.
			</p>

			<h2>1. Create an account</h2>

			<p>
				Sign up at <Link href="/register">haspulse.io/register</Link>. Free tier
				includes 5 checks.
			</p>

			<h2>2. Create a project</h2>

			<p>
				Projects group related checks together. Create one for each application
				or environment (e.g., "Production API", "Staging Workers").
			</p>

			<h2>3. Create a check</h2>

			<p>Click "New Check" and configure:</p>

			<ul>
				<li>
					<strong>Name</strong> — Descriptive name like "Daily backup" or "Queue
					processor"
				</li>
				<li>
					<strong>Schedule</strong> — How often the job runs (cron expression or
					simple interval)
				</li>
				<li>
					<strong>Grace period</strong> — How long to wait before alerting
					(default: 5 minutes)
				</li>
			</ul>

			<h2>4. Add the ping</h2>

			<p>
				Copy your check's unique URL and add it to your cron job. The simplest
				approach:
			</p>

			<div className="not-prose my-6">
				<CodeBlock
					code="curl -fsS https://haspulse.io/ping/YOUR_CHECK_ID"
					language="bash"
					label="Terminal"
				/>
			</div>

			<p>For full lifecycle tracking (start/success/fail):</p>

			<div className="not-prose my-6">
				<CodeBlock
					code={`# Signal start
curl -fsS https://haspulse.io/ping/YOUR_CHECK_ID/start

# Run your job
./backup.sh

# Signal success or failure
if [ $? -eq 0 ]; then
    curl -fsS https://haspulse.io/ping/YOUR_CHECK_ID
else
    curl -fsS https://haspulse.io/ping/YOUR_CHECK_ID/fail
fi`}
					language="bash"
					label="Full lifecycle"
				/>
			</div>

			<h2>5. Set up alerts</h2>

			<p>Go to project settings and add notification channels. We support:</p>

			<ul>
				<li>Slack (webhook or OAuth app)</li>
				<li>Discord (webhooks)</li>
				<li>PagerDuty (Events API v2)</li>
				<li>Email</li>
				<li>Custom webhooks</li>
			</ul>

			<h2>6. You're done!</h2>

			<p>
				Haspulse will alert you if a ping doesn't arrive on time. View check
				history, uptime stats, and run durations in your dashboard.
			</p>

			<div className="not-prose mt-10 flex gap-4">
				<Button asChild size="lg">
					<Link href="/register">
						Create account
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
				<Button variant="outline" size="lg" asChild>
					<Link href="/docs/sdk">View SDK docs</Link>
				</Button>
			</div>
		</article>
	)
}
