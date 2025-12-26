import { integrations } from "@/data/integrations"
import { Code } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "Integrations",
	description:
		"Learn how to integrate HasPulse cron monitoring with your stack. Guides for Node.js, Python, Go, Laravel, Rails, Docker, and more.",
	keywords: [
		"cron monitoring integration",
		"nodejs cron monitoring",
		"python cron monitoring",
		"docker cronjob monitoring",
	],
}

export default function IntegrationsPage() {
	return (
		<article className="docs-prose">
			<h1>Integrations</h1>

			<p className="lead">
				Add cron monitoring to your stack in minutes. One ping is all it takes.
			</p>

			<div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
				{integrations.map((integration) => (
					<Link
						key={integration.slug}
						href={`/docs/integrations/${integration.slug}`}
						className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors block"
					>
						<div className="flex items-start gap-4">
							<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
								<Code className="w-5 h-5 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold text-foreground mb-1">
									{integration.title}
								</h3>
								<p className="text-sm text-muted-foreground line-clamp-2">
									{integration.description}
								</p>
							</div>
						</div>
					</Link>
				))}
			</div>
		</article>
	)
}
