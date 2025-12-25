import { CronCalculator } from "@/components/cron/cron-calculator"
import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"
import { Button } from "@/components/ui/button"
import { type cronPatterns, getPatternsByCategory } from "@/data/cron-patterns"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "Cron Expression Generator & Scheduler",
	description:
		"Free online cron expression generator with live preview. Build and validate cron schedules for Linux, macOS, and cloud platforms. See next run times instantly.",
	keywords: [
		"cron generator",
		"cron expression builder",
		"cron schedule calculator",
		"crontab generator",
		"cron syntax",
		"schedule calculator",
	],
}

function PatternGrid({
	title,
	patterns,
}: {
	title: string
	patterns: typeof cronPatterns
}) {
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold text-foreground">{title}</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{patterns.slice(0, 6).map((pattern) => (
					<Link
						key={pattern.slug}
						href={`/cron/${pattern.slug}`}
						className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
					>
						<div className="font-mono text-sm text-primary mb-1">
							{pattern.expression}
						</div>
						<div className="text-sm font-medium text-foreground">
							{pattern.title}
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}

export default function CronPage() {
	const intervalPatterns = getPatternsByCategory("interval")
	const dailyPatterns = getPatternsByCategory("daily")
	const weeklyPatterns = getPatternsByCategory("weekly")
	const monthlyPatterns = getPatternsByCategory("monthly")

	return (
		<div className="min-h-screen bg-background">
			<Nav />

			<main className="max-w-4xl mx-auto px-6 py-16">
				{/* Hero */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-foreground mb-4">
						Cron Expression Generator
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Build and validate cron expressions with live preview. See exactly
						when your scheduled tasks will run.
					</p>
				</div>

				{/* Calculator */}
				<div className="bg-card border border-border rounded-xl p-6 mb-16">
					<CronCalculator />
				</div>

				{/* Cron Reference */}
				<section className="mb-16">
					<h2 className="text-2xl font-bold text-foreground mb-2">
						Cron Expression Reference
					</h2>
					<p className="text-muted-foreground mb-8">
						A cron expression consists of 5 fields: minute, hour, day of month,
						month, and day of week.
					</p>

					<div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-secondary/30">
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">
										Field
									</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">
										Values
									</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">
										Special Characters
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								<tr>
									<td className="px-4 py-3 font-mono text-foreground">
										Minute
									</td>
									<td className="px-4 py-3 text-muted-foreground">0-59</td>
									<td className="px-4 py-3 font-mono text-muted-foreground">
										* , - /
									</td>
								</tr>
								<tr>
									<td className="px-4 py-3 font-mono text-foreground">Hour</td>
									<td className="px-4 py-3 text-muted-foreground">0-23</td>
									<td className="px-4 py-3 font-mono text-muted-foreground">
										* , - /
									</td>
								</tr>
								<tr>
									<td className="px-4 py-3 font-mono text-foreground">
										Day of Month
									</td>
									<td className="px-4 py-3 text-muted-foreground">1-31</td>
									<td className="px-4 py-3 font-mono text-muted-foreground">
										* , - / L W
									</td>
								</tr>
								<tr>
									<td className="px-4 py-3 font-mono text-foreground">Month</td>
									<td className="px-4 py-3 text-muted-foreground">
										1-12 or JAN-DEC
									</td>
									<td className="px-4 py-3 font-mono text-muted-foreground">
										* , - /
									</td>
								</tr>
								<tr>
									<td className="px-4 py-3 font-mono text-foreground">
										Day of Week
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										0-6 or SUN-SAT
									</td>
									<td className="px-4 py-3 font-mono text-muted-foreground">
										* , - / L #
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="bg-card border border-border rounded-lg p-4">
							<div className="font-mono text-lg text-primary mb-1">*</div>
							<div className="text-sm text-muted-foreground">Any value</div>
						</div>
						<div className="bg-card border border-border rounded-lg p-4">
							<div className="font-mono text-lg text-primary mb-1">,</div>
							<div className="text-sm text-muted-foreground">
								List separator
							</div>
						</div>
						<div className="bg-card border border-border rounded-lg p-4">
							<div className="font-mono text-lg text-primary mb-1">-</div>
							<div className="text-sm text-muted-foreground">Range</div>
						</div>
						<div className="bg-card border border-border rounded-lg p-4">
							<div className="font-mono text-lg text-primary mb-1">/</div>
							<div className="text-sm text-muted-foreground">Step value</div>
						</div>
					</div>
				</section>

				{/* Common Patterns */}
				<section className="space-y-12">
					<h2 className="text-2xl font-bold text-foreground">
						Common Patterns
					</h2>

					<PatternGrid title="Intervals" patterns={intervalPatterns} />
					<PatternGrid title="Daily Schedules" patterns={dailyPatterns} />
					<PatternGrid title="Weekly Schedules" patterns={weeklyPatterns} />
					<PatternGrid title="Monthly Schedules" patterns={monthlyPatterns} />

					<div className="text-center">
						<Button variant="outline" asChild>
							<Link href="/cron/every-5-minutes">View all patterns</Link>
						</Button>
					</div>
				</section>

				{/* CTA */}
				<section className="mt-16 bg-card border border-border rounded-xl p-8 text-center">
					<h2 className="text-2xl font-bold text-foreground mb-4">
						Monitor your cron jobs
					</h2>
					<p className="text-muted-foreground mb-6 max-w-lg mx-auto">
						Get alerted when your scheduled tasks fail or miss their deadline.
						Simple setup with one curl command.
					</p>
					<Button asChild>
						<Link href="/register">Start monitoring free</Link>
					</Button>
				</section>
			</main>

			<Footer />
		</div>
	)
}
