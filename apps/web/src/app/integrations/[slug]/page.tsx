import { CopyButton } from "@/components/cron/copy-button"
import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"
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

function CodeBlock({
	label,
	code,
}: {
	label: string
	code: string
}) {
	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<div className="px-4 py-2 border-b border-border flex items-center justify-between">
				<span className="text-xs font-mono text-muted-foreground">{label}</span>
				<CopyButton text={code} />
			</div>
			<pre className="p-4 overflow-x-auto">
				<code className="text-sm font-mono text-foreground whitespace-pre">
					{code}
				</code>
			</pre>
		</div>
	)
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
		<div className="min-h-screen bg-background">
			<Nav />

			<main className="max-w-4xl mx-auto px-6 py-16">
				{/* Breadcrumb */}
				<div className="mb-8">
					<Link
						href="/integrations"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
					>
						<ArrowLeft className="h-3 w-3" />
						Back to Integrations
					</Link>
				</div>

				{/* Header */}
				<header className="mb-12">
					<h1 className="text-4xl font-bold text-foreground mb-4">
						{integration.title}
					</h1>
					<p className="text-lg text-muted-foreground">
						{integration.description}
					</p>
				</header>

				{/* Features */}
				<section className="mb-12">
					<h2 className="text-xl font-semibold text-foreground mb-4">
						Features
					</h2>
					<ul className="space-y-2">
						{integration.features.map((feature) => (
							<li key={feature} className="flex items-center gap-3">
								<Check className="h-4 w-4 text-primary flex-shrink-0" />
								<span className="text-foreground">{feature}</span>
							</li>
						))}
					</ul>
				</section>

				{/* Code Examples */}
				<section className="mb-12">
					<h2 className="text-xl font-semibold text-foreground mb-4">
						Code Examples
					</h2>
					<div className="space-y-6">
						{integration.examples.map((example) => (
							<CodeBlock
								key={example.label}
								label={example.label}
								code={example.code}
							/>
						))}
					</div>
				</section>

				{/* How It Works */}
				<section className="mb-12">
					<h2 className="text-xl font-semibold text-foreground mb-4">
						How It Works
					</h2>
					<div className="bg-card border border-border rounded-xl p-6">
						<ol className="space-y-4">
							<li className="flex gap-4">
								<span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
									1
								</span>
								<div>
									<div className="font-medium text-foreground">
										Create a check in Haspulse
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
				</section>

				{/* Related Integrations */}
				{relatedIntegrations.length > 0 && (
					<section className="mb-12">
						<h2 className="text-xl font-semibold text-foreground mb-4">
							Related Integrations
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{relatedIntegrations.map((related) => (
								<Link
									key={related.slug}
									href={`/integrations/${related.slug}`}
									className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
								>
									<div className="text-sm font-medium text-foreground">
										{related.title}
									</div>
								</Link>
							))}
						</div>
					</section>
				)}

				{/* CTA */}
				<section className="bg-card border border-border rounded-xl p-8 text-center">
					<h2 className="text-xl font-bold text-foreground mb-4">
						Start monitoring in minutes
					</h2>
					<p className="text-muted-foreground mb-6 max-w-lg mx-auto">
						Create your first check and start receiving alerts when your
						scheduled jobs fail.
					</p>
					<Button asChild>
						<Link href="/register">Get started free</Link>
					</Button>
				</section>
			</main>

			<Footer />
		</div>
	)
}
