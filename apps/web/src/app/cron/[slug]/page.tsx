import { CopyButton } from "@/components/cron/copy-button"
import { CronBreakdown } from "@/components/cron/cron-breakdown"
import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"
import { Button } from "@/components/ui/button"
import {
	cronPatterns,
	getCronPatternBySlug,
	getRelatedPatterns,
} from "@/data/cron-patterns"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

type Props = {
	params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
	return cronPatterns.map((pattern) => ({
		slug: pattern.slug,
	}))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const pattern = getCronPatternBySlug(slug)

	if (!pattern) {
		return { title: "Pattern Not Found" }
	}

	return {
		title: `${pattern.title} - Cron Expression`,
		description: `${pattern.description} Cron expression: ${pattern.expression}. See next scheduled runs and learn how to use this pattern.`,
		keywords: [...pattern.keywords, "cron expression", "cron schedule"],
	}
}

export default async function CronPatternPage({ params }: Props) {
	const { slug } = await params
	const pattern = getCronPatternBySlug(slug)

	if (!pattern) {
		notFound()
	}

	const relatedPatterns = getRelatedPatterns(pattern)

	// Find prev/next patterns for navigation
	const currentIndex = cronPatterns.findIndex((p) => p.slug === slug)
	const prevPattern = currentIndex > 0 ? cronPatterns[currentIndex - 1] : null
	const nextPattern =
		currentIndex < cronPatterns.length - 1
			? cronPatterns[currentIndex + 1]
			: null

	return (
		<div className="min-h-screen bg-background">
			<Nav />

			<main className="max-w-4xl mx-auto px-6 py-16">
				{/* Breadcrumb */}
				<div className="mb-8">
					<Link
						href="/cron"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
					>
						<ArrowLeft className="h-3 w-3" />
						Back to Cron Generator
					</Link>
				</div>

				{/* Header */}
				<header className="mb-12">
					<div className="flex items-center gap-3 mb-4">
						<span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded capitalize">
							{pattern.category}
						</span>
					</div>
					<h1 className="text-4xl font-bold text-foreground mb-4">
						{pattern.title}
					</h1>
					<p className="text-lg text-muted-foreground">{pattern.description}</p>
				</header>

				{/* Expression */}
				<section className="bg-card border border-border rounded-xl p-6 mb-12">
					<div className="flex items-center justify-between mb-4">
						<div className="text-sm font-medium text-muted-foreground">
							Cron Expression
						</div>
						<CopyButton text={pattern.expression} />
					</div>
					<div className="font-mono text-3xl text-primary">
						{pattern.expression}
					</div>
				</section>

				{/* Breakdown */}
				<section className="mb-12">
					<h2 className="text-xl font-semibold text-foreground mb-6">
						Expression Breakdown
					</h2>
					<CronBreakdown expression={pattern.expression} runCount={10} />
				</section>

				{/* Use Cases */}
				<section className="mb-12">
					<h2 className="text-xl font-semibold text-foreground mb-4">
						Common Use Cases
					</h2>
					<ul className="space-y-2">
						{pattern.useCases.map((useCase) => (
							<li key={useCase} className="flex items-center gap-3">
								<Check className="h-4 w-4 text-primary flex-shrink-0" />
								<span className="text-foreground">{useCase}</span>
							</li>
						))}
					</ul>
				</section>

				{/* Code Examples */}
				<section className="mb-12">
					<h2 className="text-xl font-semibold text-foreground mb-4">
						Integration Example
					</h2>
					<div className="bg-card border border-border rounded-xl overflow-hidden">
						<div className="px-4 py-2 border-b border-border flex items-center justify-between">
							<span className="text-xs font-mono text-muted-foreground">
								crontab
							</span>
							<CopyButton
								text={`${pattern.expression} /path/to/script.sh && curl -fsS https://haspulse.dev/ping/YOUR_CHECK_ID`}
							/>
						</div>
						<div className="p-4 font-mono text-sm overflow-x-auto">
							<span className="text-muted-foreground"># Add to crontab -e</span>
							<br />
							<span className="text-primary">{pattern.expression}</span>{" "}
							<span className="text-foreground">/path/to/script.sh</span>{" "}
							<span className="text-muted-foreground">&&</span>{" "}
							<span className="text-foreground">
								curl -fsS https://haspulse.dev/ping/
							</span>
							<span className="text-warning">YOUR_CHECK_ID</span>
						</div>
					</div>
				</section>

				{/* Related Patterns */}
				{relatedPatterns.length > 0 && (
					<section className="mb-12">
						<h2 className="text-xl font-semibold text-foreground mb-4">
							Related Patterns
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{relatedPatterns.map((related) => (
								<Link
									key={related.slug}
									href={`/cron/${related.slug}`}
									className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
								>
									<div className="font-mono text-sm text-primary mb-1">
										{related.expression}
									</div>
									<div className="text-sm font-medium text-foreground">
										{related.title}
									</div>
								</Link>
							))}
						</div>
					</section>
				)}

				{/* CTA */}
				<section className="bg-card border border-border rounded-xl p-8 text-center mb-12">
					<h2 className="text-xl font-bold text-foreground mb-4">
						Monitor this schedule with Haspulse
					</h2>
					<p className="text-muted-foreground mb-6 max-w-lg mx-auto">
						Get alerted instantly when your{" "}
						{pattern.title.toLowerCase().replace("run ", "")} job fails or
						misses its schedule.
					</p>
					<Button asChild>
						<Link href="/register">Start monitoring free</Link>
					</Button>
				</section>

				{/* Prev/Next Navigation */}
				<nav className="flex items-center justify-between">
					{prevPattern ? (
						<Link
							href={`/cron/${prevPattern.slug}`}
							className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>{prevPattern.title}</span>
						</Link>
					) : (
						<div />
					)}
					{nextPattern ? (
						<Link
							href={`/cron/${nextPattern.slug}`}
							className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<span>{nextPattern.title}</span>
							<ArrowRight className="h-4 w-4" />
						</Link>
					) : (
						<div />
					)}
				</nav>
			</main>

			<Footer />
		</div>
	)
}
