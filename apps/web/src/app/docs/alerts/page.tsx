import { alertChannels } from "@/data/integrations"
import { Bell } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "Alert Channels",
	description:
		"Set up alert channels for Haspulse. Get notified via Slack, Discord, PagerDuty, email, or webhooks when your cron jobs fail.",
	keywords: [
		"slack alerts",
		"discord notifications",
		"pagerduty integration",
		"webhook alerts",
	],
}

export default function AlertsPage() {
	return (
		<article className="docs-prose">
			<h1>Alert Channels</h1>

			<p className="lead">
				Get notified where you already work. Set up alerts in minutes.
			</p>

			<div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
				{alertChannels.map((channel) => (
					<Link
						key={channel.slug}
						href={`/docs/alerts/${channel.slug}`}
						className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors block"
					>
						<div className="flex items-start gap-4">
							<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
								<Bell className="w-5 h-5 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold text-foreground mb-1">
									{channel.title}
								</h3>
								<p className="text-sm text-muted-foreground line-clamp-2">
									{channel.description}
								</p>
							</div>
						</div>
					</Link>
				))}
			</div>
		</article>
	)
}
