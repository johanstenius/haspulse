import { CodeBlock } from "@/components/docs/code-block"
import { Button } from "@/components/ui/button"
import { getIntegrationBySlug, integrations } from "@/data/integrations"
import { ArrowLeft, Check } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

type Props = {
	params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
	return integrations.map((integration) => ({
		slug: integration.slug,
	}))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const integration = getIntegrationBySlug(slug)

	if (!integration) {
		return { title: "Integration Not Found" }
	}

	return {
		title: integration.title,
		description: integration.description,
		keywords: [
			...integration.keywords,
			"cron monitoring",
			"scheduled task monitoring",
		],
	}
}

export default async function IntegrationPage({ params }: Props) {
	const { slug } = await params
	const integration = getIntegrationBySlug(slug)

	if (!integration) {
		notFound()
	}

	const relatedIntegrations = integration.relatedSlugs
		.map((s) => getIntegrationBySlug(s))
		.filter((i) => i !== undefined)

	return (
		<article className="docs-prose">
			<div className="not-prose mb-8">
				<Link
					href="/docs/integrations"
					className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
				>
					<ArrowLeft className="h-3 w-3" />
					Back to Integrations
				</Link>
			</div>

			<h1>{integration.title}</h1>

			<p className="lead">{integration.description}</p>

			<h2>Features</h2>

			<ul className="not-prose space-y-2 mb-8">
				{integration.features.map((feature) => (
					<li key={feature} className="flex items-center gap-3">
						<Check className="h-4 w-4 text-primary flex-shrink-0" />
						<span className="text-foreground">{feature}</span>
					</li>
				))}
			</ul>

			<h2>Code Examples</h2>

			<div className="space-y-6 mb-8">
				{integration.examples.map((example) => (
					<CodeBlock
						key={example.label}
						label={example.label}
						code={example.code}
						language={example.language}
					/>
				))}
			</div>

			<h2>How It Works</h2>

			<div className="not-prose bg-card border border-border rounded-xl p-6 mb-8">
				<ol className="space-y-4">
					<li className="flex gap-4">
						<span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
							1
						</span>
						<div>
							<div className="font-medium text-foreground">
								Create a check in HasPulse
							</div>
							<div className="text-sm text-muted-foreground">
								Set your expected schedule (e.g., every 5 minutes)
							</div>
						</div>
					</li>
					<li className="flex gap-4">
						<span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
							2
						</span>
						<div>
							<div className="font-medium text-foreground">
								Add the ping to your code
							</div>
							<div className="text-sm text-muted-foreground">
								Ping the unique URL when your job runs successfully
							</div>
						</div>
					</li>
					<li className="flex gap-4">
						<span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
							3
						</span>
						<div>
							<div className="font-medium text-foreground">
								Get alerted on failures
							</div>
							<div className="text-sm text-muted-foreground">
								If a ping doesn't arrive on time, we notify you
							</div>
						</div>
					</li>
				</ol>
			</div>

			{relatedIntegrations.length > 0 && (
				<>
					<h2>Related Integrations</h2>
					<div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
						{relatedIntegrations.map((related) => (
							<Link
								key={related.slug}
								href={`/docs/integrations/${related.slug}`}
								className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
							>
								<div className="text-sm font-medium text-foreground">
									{related.title}
								</div>
							</Link>
						))}
					</div>
				</>
			)}

			<div className="not-prose bg-card border border-border rounded-xl p-8 text-center">
				<h2 className="text-xl font-bold text-foreground mb-4">
					Start monitoring in minutes
				</h2>
				<p className="text-muted-foreground mb-6 max-w-lg mx-auto">
					Create your first check and start receiving alerts when your scheduled
					jobs fail.
				</p>
				<Button asChild>
					<Link href="/register">Get started free</Link>
				</Button>
			</div>
		</article>
	)
}
