"use client"

import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"
import { Button } from "@/components/ui/button"
import { BarChart3, Bell, Check, Clock, Code, Users, Zap } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function StatusPill() {
	return (
		<div className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-sm">
			<div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
			<span className="text-muted-foreground">Dead simple cron monitoring</span>
		</div>
	)
}

function CodeBlock() {
	const [tab, setTab] = useState<"sdk" | "fetch">("sdk")

	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<div className="px-4 py-2 border-b border-border flex items-center gap-4">
				<button
					type="button"
					onClick={() => setTab("sdk")}
					className={`text-xs font-mono transition-colors ${
						tab === "sdk"
							? "text-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					SDK
				</button>
				<button
					type="button"
					onClick={() => setTab("fetch")}
					className={`text-xs font-mono transition-colors ${
						tab === "fetch"
							? "text-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					fetch
				</button>
			</div>
			<div className="p-6 font-mono text-sm whitespace-pre">
				{tab === "sdk" ? (
					<>
						<span className="text-muted-foreground">
							{"// Wrap your job - auto success/fail"}
						</span>
						{"\n"}
						<span className="text-primary">await</span>
						<span className="text-foreground"> haspulse.</span>
						<span className="text-primary">wrap</span>
						<span className="text-foreground">(</span>
						<span className="text-warning">&apos;db-backup&apos;</span>
						<span className="text-foreground">, </span>
						<span className="text-primary">async</span>
						<span className="text-foreground"> () </span>
						<span className="text-primary">=&gt;</span>
						<span className="text-foreground">{" {"}</span>
						{"\n  "}
						<span className="text-primary">await</span>
						<span className="text-foreground"> runBackup()</span>
						{"\n"}
						<span className="text-foreground">{"})"}</span>
					</>
				) : (
					<>
						<span className="text-primary">await</span>
						<span className="text-foreground"> </span>
						<span className="text-primary">fetch</span>
						<span className="text-foreground">(</span>
						<span className="text-warning">
							&apos;https://api.haspulse.dev/ping/db-backup&apos;
						</span>
						<span className="text-foreground">{", {"}</span>
						{"\n  "}
						<span className="text-foreground">{"headers: { "}</span>
						<span className="text-warning">Authorization</span>
						<span className="text-foreground">: </span>
						<span className="text-warning">{"`Bearer ${API_KEY}`"}</span>
						<span className="text-foreground">{" }"}</span>
						{"\n"}
						<span className="text-foreground">{"})"}</span>
					</>
				)}
			</div>
		</div>
	)
}

function FeatureCard({
	icon: Icon,
	title,
	description,
}: {
	icon: typeof Clock
	title: string
	description: string
}) {
	return (
		<div className="bg-card border border-border rounded-xl p-6">
			<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
				<Icon className="w-5 h-5 text-primary" />
			</div>
			<h3 className="font-semibold text-foreground mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
	)
}

function PricingCard({
	name,
	price,
	period,
	features,
	highlighted = false,
}: {
	name: string
	price: string
	period: string
	features: string[]
	highlighted?: boolean
}) {
	return (
		<div
			className={`rounded-xl p-8 flex flex-col ${
				highlighted
					? "bg-card border-2 border-primary/50 relative"
					: "bg-card border border-border"
			}`}
		>
			{highlighted && (
				<div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
					Popular
				</div>
			)}
			<div
				className={`text-sm uppercase tracking-wide mb-2 ${highlighted ? "text-primary" : "text-muted-foreground"}`}
			>
				{name}
			</div>
			<div className="mb-1">
				<span className="text-4xl font-bold text-foreground">{price}</span>
				{price !== "$0" && (
					<span className="text-lg text-muted-foreground font-normal">/mo</span>
				)}
			</div>
			<div className="text-sm text-muted-foreground mb-6">{period}</div>
			<ul className="space-y-3 mb-8 flex-1">
				{features.map((feature) => (
					<li key={feature} className="flex items-center gap-3 text-sm">
						<Check className="w-4 h-4 text-primary flex-shrink-0" />
						<span className="text-foreground">{feature}</span>
					</li>
				))}
			</ul>
			<Button
				variant={highlighted ? "default" : "outline"}
				className="w-full"
				asChild
			>
				<Link href="/register">
					{highlighted ? "Start Free Trial" : "Get Started"}
				</Link>
			</Button>
		</div>
	)
}

function DashboardPreview() {
	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/20">
			<div className="px-4 py-3 border-b border-border flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-muted" />
				<div className="w-3 h-3 rounded-full bg-muted" />
				<div className="w-3 h-3 rounded-full bg-muted" />
			</div>
			<div className="p-6">
				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
					<div className="bg-secondary/50 rounded-lg p-4 text-left">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Uptime
						</div>
						<div className="text-2xl font-semibold text-primary">99.98%</div>
					</div>
					<div className="bg-secondary/50 rounded-lg p-4 text-left">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Pings
						</div>
						<div className="text-2xl font-semibold text-foreground">2,147</div>
					</div>
					<div className="bg-secondary/50 rounded-lg p-4 text-left">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Incidents
						</div>
						<div className="text-2xl font-semibold text-foreground">0</div>
					</div>
					<div className="bg-secondary/50 rounded-lg p-4 text-left">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Checks
						</div>
						<div className="text-2xl font-semibold text-foreground">7</div>
					</div>
				</div>

				{/* Checks Table */}
				<table className="w-full text-sm text-left">
					<thead>
						<tr className="text-xs text-muted-foreground uppercase tracking-wide">
							<th className="py-2 font-medium">Check</th>
							<th className="py-2 font-medium">Status</th>
							<th className="py-2 font-medium font-mono">Schedule</th>
							<th className="py-2 font-medium">Last ping</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/50">
						<tr>
							<td className="py-3 font-medium text-foreground">
								Database backup
							</td>
							<td className="py-3">
								<span className="inline-flex items-center gap-1.5 text-primary text-xs font-medium">
									<span className="w-1.5 h-1.5 bg-primary rounded-full" />
									UP
								</span>
							</td>
							<td className="py-3 font-mono text-xs text-muted-foreground">
								0 3 * * *
							</td>
							<td className="py-3 text-muted-foreground">2m ago</td>
						</tr>
						<tr>
							<td className="py-3 font-medium text-foreground">Email queue</td>
							<td className="py-3">
								<span className="inline-flex items-center gap-1.5 text-primary text-xs font-medium">
									<span className="w-1.5 h-1.5 bg-primary rounded-full" />
									UP
								</span>
							</td>
							<td className="py-3 font-mono text-xs text-muted-foreground">
								*/5 * * * *
							</td>
							<td className="py-3 text-muted-foreground">34s ago</td>
						</tr>
						<tr>
							<td className="py-3 font-medium text-foreground">SSL renewal</td>
							<td className="py-3">
								<span className="inline-flex items-center gap-1.5 text-warning text-xs font-medium">
									<span className="w-1.5 h-1.5 bg-warning rounded-full" />
									LATE
								</span>
							</td>
							<td className="py-3 font-mono text-xs text-muted-foreground">
								0 9 * * 1
							</td>
							<td className="py-3 text-warning">2h overdue</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	)
}

function CTAButtons() {
	return (
		<div className="flex items-center justify-center gap-4">
			<Button size="lg" asChild>
				<Link href="/register">Get Started</Link>
			</Button>
			<Button size="lg" variant="outline" asChild>
				<Link href="/docs">View Docs</Link>
			</Button>
		</div>
	)
}

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-background">
			<Nav />

			{/* Hero Section */}
			<section className="py-24">
				<div className="max-w-4xl mx-auto px-6 text-center">
					<StatusPill />

					<h1 className="font-display text-6xl font-bold leading-tight mt-8 tracking-tight">
						Never miss a
						<br />
						<span className="text-primary glow-text">failed cron job</span>
					</h1>

					<p className="text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
						Get instant alerts when scheduled tasks miss their deadline.
						Beautiful status pages included.
					</p>

					<div className="mt-10">
						<CTAButtons />
					</div>
				</div>
			</section>

			{/* Dashboard Preview */}
			<section className="max-w-4xl mx-auto px-6 pb-24">
				<DashboardPreview />
			</section>

			{/* Features Section */}
			<section id="features" className="py-24 border-t border-border">
				<div className="max-w-6xl mx-auto px-6">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold text-foreground mb-4">
							Everything you need
						</h2>
						<p className="text-muted-foreground max-w-xl mx-auto">
							Monitor cron jobs, background tasks, and scheduled scripts. Get
							alerts before your customers notice.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6">
						<FeatureCard
							icon={Clock}
							title="Dead Man's Switch"
							description="Each check has a unique URL. Ping it when your job runs. Miss a ping? We alert you."
						/>
						<FeatureCard
							icon={Bell}
							title="Multi-Channel Alerts"
							description="Email, Slack, webhooks. Get notified where you already work."
						/>
						<FeatureCard
							icon={BarChart3}
							title="Status Pages"
							description="Beautiful public status pages included. Show uptime to customers."
						/>
						<FeatureCard
							icon={Code}
							title="Simple Integration"
							description="One HTTP request. Works with any language, any framework."
						/>
						<FeatureCard
							icon={Users}
							title="Team Access"
							description="Invite your team. Everyone stays in the loop."
						/>
						<FeatureCard
							icon={Zap}
							title="Fast & Reliable"
							description="Global edge network. Sub-second latency worldwide."
						/>
					</div>
				</div>
			</section>

			{/* Code Example */}
			<section className="py-24 border-t border-border">
				<div className="max-w-4xl mx-auto px-6">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-foreground mb-4">
							Simple to integrate
						</h2>
						<p className="text-muted-foreground">Add to your cron job, done.</p>
					</div>

					<CodeBlock />

					<p className="text-center text-sm text-muted-foreground mt-6">
						Install with{" "}
						<code className="text-foreground">npm i @haspulse/sdk</code>
						{" · "}
						<Link
							href="/docs/sdk"
							className="text-primary hover:underline underline-offset-4"
						>
							View docs
						</Link>
					</p>
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="py-24 border-t border-border">
				<div className="max-w-4xl mx-auto px-6">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold text-foreground mb-4">
							Simple pricing
						</h2>
						<p className="text-muted-foreground">
							Start free, upgrade when you need more.
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
						<PricingCard
							name="Free"
							price="$0"
							period="Forever"
							features={[
								"10 checks",
								"Email alerts",
								"2 status pages",
								"7 day history",
							]}
						/>
						<PricingCard
							name="Pro"
							price="$12"
							period="Billed annually"
							features={[
								"Unlimited checks",
								"Slack + webhooks",
								"5 status pages",
								"90 day history",
								"Team access",
							]}
							highlighted
						/>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-24 border-t border-border">
				<div className="max-w-2xl mx-auto px-6 text-center">
					<h2 className="text-3xl font-bold text-foreground mb-4">
						Ready to stop missing cron failures?
					</h2>
					<p className="text-muted-foreground mb-8">
						Start monitoring your scheduled tasks in minutes.
					</p>

					<CTAButtons />
				</div>
			</section>

			<Footer />
		</div>
	)
}
