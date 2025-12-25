import { Button } from "@/components/ui/button"
import { alertChannels, getAlertChannelBySlug } from "@/data/integrations"
import { ArrowLeft, Check } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

type Props = {
	params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
	return alertChannels.map((channel) => ({
		slug: channel.slug,
	}))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const channel = getAlertChannelBySlug(slug)

	if (!channel) {
		return { title: "Alert Channel Not Found" }
	}

	return {
		title: channel.title,
		description: channel.description,
		keywords: [
			...channel.keywords,
			"cron monitoring alerts",
			"job failure alerts",
		],
	}
}

export default async function AlertChannelPage({ params }: Props) {
	const { slug } = await params
	const channel = getAlertChannelBySlug(slug)

	if (!channel) {
		notFound()
	}

	return (
		<article className="docs-prose">
			<div className="not-prose mb-8">
				<Link
					href="/docs/alerts"
					className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
				>
					<ArrowLeft className="h-3 w-3" />
					Back to Alert Channels
				</Link>
			</div>

			<h1>{channel.title}</h1>

			<p className="lead">{channel.description}</p>

			<h2>Features</h2>

			<ul className="not-prose space-y-2 mb-8">
				{channel.features.map((feature) => (
					<li key={feature} className="flex items-center gap-3">
						<Check className="h-4 w-4 text-primary flex-shrink-0" />
						<span className="text-foreground">{feature}</span>
					</li>
				))}
			</ul>

			<h2>Setup Steps</h2>

			<div className="not-prose bg-card border border-border rounded-xl p-6 mb-8">
				<ol className="space-y-4">
					{channel.setupSteps.map((step, index) => (
						<li key={step} className="flex gap-4">
							<span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
								{index + 1}
							</span>
							<div className="text-foreground">{step}</div>
						</li>
					))}
				</ol>
			</div>

			<div className="not-prose bg-card border border-border rounded-xl p-8 text-center">
				<h2 className="text-xl font-bold text-foreground mb-4">
					Start receiving alerts
				</h2>
				<p className="text-muted-foreground mb-6 max-w-lg mx-auto">
					Set up your first alert channel and never miss a failed job again.
				</p>
				<Button asChild>
					<Link href="/register">Get started free</Link>
				</Button>
			</div>
		</article>
	)
}
