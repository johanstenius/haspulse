import { CodeBlock } from "@/components/docs/code-block"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bell, Clock, Shield } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "Documentation",
	description:
		"Learn how to monitor your cron jobs with Haspulse. Simple integration, instant alerts, beautiful status pages.",
	keywords: [
		"haspulse documentation",
		"cron monitoring docs",
		"scheduled task monitoring",
	],
}

export default function DocsPage() {
	return (
		<article className="docs-prose">
			<h1>Introduction</h1>

			<p className="lead">
				Haspulse monitors your scheduled jobs and alerts you when they fail. One
				line of code. Beautiful status pages included.
			</p>

			<div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-10">
				<div className="docs-feature-card">
					<div className="docs-feature-icon">
						<Clock className="w-5 h-5" />
					</div>
					<h3 className="docs-feature-title">Dead Simple</h3>
					<p className="docs-feature-desc">
						Add one curl command or SDK call to your cron job. That's it.
					</p>
				</div>
				<div className="docs-feature-card">
					<div className="docs-feature-icon">
						<Bell className="w-5 h-5" />
					</div>
					<h3 className="docs-feature-title">Instant Alerts</h3>
					<p className="docs-feature-desc">
						Get notified via Slack, Discord, PagerDuty, or email when jobs fail.
					</p>
				</div>
				<div className="docs-feature-card">
					<div className="docs-feature-icon">
						<Shield className="w-5 h-5" />
					</div>
					<h3 className="docs-feature-title">Status Pages</h3>
					<p className="docs-feature-desc">
						Beautiful public status pages included. No extra cost.
					</p>
				</div>
			</div>

			<h2>How It Works</h2>

			<ol>
				<li>
					<strong>Create a check</strong> — Set your expected schedule (e.g.,
					every 5 minutes, daily at 3 AM)
				</li>
				<li>
					<strong>Add the ping</strong> — Ping the unique URL when your job runs
					successfully
				</li>
				<li>
					<strong>Get alerts</strong> — If a ping doesn't arrive on time, we
					notify you
				</li>
			</ol>

			<h2>Quick Example</h2>

			<p>Add this to the end of any cron job:</p>

			<div className="not-prose my-6">
				<CodeBlock
					code="curl -fsS https://haspulse.dev/ping/YOUR_CHECK_ID"
					language="bash"
					label="Terminal"
				/>
			</div>

			<p>Or use the SDK for full lifecycle tracking:</p>

			<div className="not-prose my-6">
				<CodeBlock
					code={`import { HasPulse } from 'haspulse';

const haspulse = new HasPulse({
  apiKey: process.env.HASPULSE_API_KEY
});

await haspulse.wrap('YOUR_CHECK_ID', async () => {
  await yourScheduledTask();
});`}
					language="typescript"
					label="SDK with wrap()"
				/>
			</div>

			<div className="not-prose mt-10">
				<Button asChild size="lg">
					<Link href="/docs/quickstart">
						Get started
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
			</div>
		</article>
	)
}
