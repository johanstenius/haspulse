"use client"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { useBilling } from "@/lib/query"
import { CreditCard, Sparkles, Zap } from "lucide-react"

function UsageBar({
	label,
	current,
	limit,
}: { label: string; current: number; limit: number | null }) {
	const percentage = limit ? Math.min((current / limit) * 100, 100) : 0
	const isNearLimit = limit && current >= limit * 0.8
	const isAtLimit = limit && current >= limit

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm">
				<span className="text-muted-foreground">{label}</span>
				<span className={isAtLimit ? "text-destructive font-medium" : ""}>
					{current} / {limit ?? "∞"}
				</span>
			</div>
			{limit && (
				<Progress
					value={percentage}
					className={isNearLimit ? "[&>div]:bg-amber-500" : ""}
				/>
			)}
		</div>
	)
}

export default function BillingPage() {
	const { data: billing, isLoading } = useBilling()

	async function handleUpgrade() {
		const { url } = await api.billing.createCheckout(
			`${window.location.origin}/settings/billing?success=true`,
			`${window.location.origin}/settings/billing`,
		)
		window.location.href = url
	}

	async function handleManageBilling() {
		const { url } = await api.billing.createPortal(
			`${window.location.origin}/settings/billing`,
		)
		window.location.href = url
	}

	if (isLoading) {
		return (
			<div className="p-6 max-w-2xl space-y-6">
				<PageHeader
					title="Billing"
					description="Manage your subscription and usage"
				/>
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!billing) return null

	const isPro = billing.plan === "pro"
	const isFree = billing.plan === "free"

	return (
		<div className="p-6 max-w-2xl space-y-6">
			<PageHeader
				title="Billing"
				description="Manage your subscription and usage"
			/>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div className="flex items-center gap-3">
						<CardTitle>Current Plan</CardTitle>
						<Badge variant={isPro ? "default" : "secondary"}>
							{billing.displayName}
						</Badge>
						{billing.isTrialing && (
							<Badge
								variant="outline"
								className="text-amber-600 border-amber-600"
							>
								Trial
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{billing.isTrialing && billing.trialEndsAt && (
						<p className="text-sm text-muted-foreground">
							Your trial ends on{" "}
							{new Date(billing.trialEndsAt).toLocaleDateString()}
						</p>
					)}

					<div className="space-y-4">
						<h4 className="text-sm font-medium">Usage</h4>
						<UsageBar
							label="Checks"
							current={billing.usage.checks.current}
							limit={billing.usage.checks.limit}
						/>
						<UsageBar
							label="Projects"
							current={billing.usage.projects.current}
							limit={billing.usage.projects.limit}
						/>
					</div>

					<div className="flex gap-3">
						{isFree && (
							<Button onClick={handleUpgrade} className="gap-2">
								<Sparkles className="h-4 w-4" />
								Upgrade to Pro
							</Button>
						)}
						{isPro && (
							<Button
								variant="outline"
								onClick={handleManageBilling}
								className="gap-2"
							>
								<CreditCard className="h-4 w-4" />
								Manage Billing
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{isFree && (
				<Card className="border-primary/20 bg-primary/5">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-5 w-5 text-primary" />
							Upgrade to Pro
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground">
							Get more out of HasPulse with Pro features:
						</p>
						<ul className="space-y-2 text-sm">
							<li className="flex items-center gap-2">
								<span className="text-primary">✓</span>
								100 checks (vs 10 on Free)
							</li>
							<li className="flex items-center gap-2">
								<span className="text-primary">✓</span>
								Unlimited projects
							</li>
							<li className="flex items-center gap-2">
								<span className="text-primary">✓</span>
								Unlimited notification channels
							</li>
							<li className="flex items-center gap-2">
								<span className="text-primary">✓</span>
								500 ping history per check
							</li>
							<li className="flex items-center gap-2">
								<span className="text-primary">✓</span>
								1MB ping body limit
							</li>
						</ul>
						<p className="text-lg font-semibold">$12/month</p>
						<Button onClick={handleUpgrade} className="gap-2">
							<Sparkles className="h-4 w-4" />
							Upgrade Now
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
