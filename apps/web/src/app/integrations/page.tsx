import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"
import { alertChannels, integrations } from "@/data/integrations"
import { Bell, Code } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "Integrations",
	description:
		"Learn how to integrate Haspulse cron monitoring with your stack. Guides for Node.js, Python, Go, Laravel, Rails, Docker, and more.",
	keywords: [
		"cron monitoring integration",
		"nodejs cron monitoring",
		"python cron monitoring",
		"docker cronjob monitoring",
		"slack alerts",
	],
}

function IntegrationCard({
	slug,
	title,
	description,
}: {
	slug: string
	title: string
	description: string
}) {
	return (
		<Link
			href={`/integrations/${slug}`}
			className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors block"
		>
			<div className="flex items-start gap-4">
				<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
					<Code className="w-5 h-5 text-primary" />
				</div>
				<div>
					<h3 className="font-semibold text-foreground mb-1">{title}</h3>
					<p className="text-sm text-muted-foreground line-clamp-2">
						{description}
					</p>
				</div>
			</div>
		</Link>
	)
}

function AlertCard({
	slug,
	title,
	description,
}: {
	slug: string
	title: string
	description: string
}) {
	return (
		<Link
			href={`/integrations/alerts/${slug}`}
			className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors block"
		>
			<div className="flex items-start gap-4">
				<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
					<Bell className="w-5 h-5 text-primary" />
				</div>
				<div>
					<h3 className="font-semibold text-foreground mb-1">{title}</h3>
					<p className="text-sm text-muted-foreground line-clamp-2">
						{description}
					</p>
				</div>
			</div>
		</Link>
	)
}

export default function IntegrationsPage() {
	return (
		<div className="min-h-screen bg-background">
			<Nav />

			<main className="max-w-4xl mx-auto px-6 py-16">
				{/* Hero */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-foreground mb-4">
						Integrations
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Add cron monitoring to your stack in minutes. One ping is all it
						takes.
					</p>
				</div>

				{/* Language/Framework Integrations */}
				<section className="mb-16">
					<h2 className="text-2xl font-bold text-foreground mb-2">
						Languages & Frameworks
					</h2>
					<p className="text-muted-foreground mb-8">
						Step-by-step guides for integrating Haspulse with your tech stack.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{integrations.map((integration) => (
							<IntegrationCard
								key={integration.slug}
								slug={integration.slug}
								title={integration.title}
								description={integration.description}
							/>
						))}
					</div>
				</section>

				{/* Alert Channels */}
				<section>
					<h2 className="text-2xl font-bold text-foreground mb-2">
						Alert Channels
					</h2>
					<p className="text-muted-foreground mb-8">
						Get notified where you already work. Set up alerts in minutes.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{alertChannels.map((channel) => (
							<AlertCard
								key={channel.slug}
								slug={channel.slug}
								title={channel.title}
								description={channel.description}
							/>
						))}
					</div>
				</section>
			</main>

			<Footer />
		</div>
	)
}
