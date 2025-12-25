import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "Pricing",
	description:
		"Haspulse pricing plans. Start free, upgrade when you need more checks and features.",
	keywords: [
		"haspulse pricing",
		"cron monitoring pricing",
		"uptime monitoring cost",
	],
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
			className={`bg-card border rounded-xl p-6 ${
				highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"
			}`}
		>
			<h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
			<p className="text-sm text-muted-foreground mb-4">{period}</p>
			<div className="text-3xl font-bold text-foreground mb-6">
				{price}
				{price !== "$0" && <span className="text-sm font-normal">/mo</span>}
			</div>
			<ul className="space-y-3 mb-6">
				{features.map((feature) => (
					<li key={feature} className="flex items-center gap-2 text-sm">
						<Check className="h-4 w-4 text-primary flex-shrink-0" />
						<span className="text-foreground">{feature}</span>
					</li>
				))}
			</ul>
			<Button
				asChild
				variant={highlighted ? "default" : "outline"}
				className="w-full"
			>
				<Link href="/register">Get started</Link>
			</Button>
		</div>
	)
}

export default function PricingPage() {
	return (
		<article className="docs-prose">
			<h1>Pricing</h1>

			<p className="lead">Start free, upgrade when you need more.</p>

			<div className="not-prose grid md:grid-cols-2 gap-6 my-8">
				<PricingCard
					name="Free"
					price="$0"
					period="Forever"
					features={[
						"5 checks",
						"Email alerts",
						"1 status page",
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

			<h2>FAQ</h2>

			<h3>What counts as a check?</h3>
			<p>
				A check is a single cron job or scheduled task you want to monitor. Each
				check has its own schedule and alerting configuration.
			</p>

			<h3>Can I change plans anytime?</h3>
			<p>
				Yes. Upgrade or downgrade at any time. When upgrading, you'll be charged
				a prorated amount. When downgrading, the remaining balance is credited.
			</p>

			<h3>What happens if I exceed my check limit?</h3>
			<p>
				Existing checks continue to work. You won't be able to create new checks
				until you upgrade or delete some checks.
			</p>

			<h3>Is there a trial for Pro?</h3>
			<p>
				Yes, Pro includes a 14-day free trial. No credit card required to start.
			</p>

			<h3>Do you offer discounts for annual billing?</h3>
			<p>Yes. Annual billing is $12/month (vs $15/month billed monthly).</p>

			<h3>What payment methods do you accept?</h3>
			<p>
				We accept all major credit cards. Payments are processed securely via
				Stripe.
			</p>
		</article>
	)
}
