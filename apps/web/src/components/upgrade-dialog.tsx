"use client"

import { api } from "@/lib/api"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog"

type UpgradeDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	resource: string
	limit: number
}

export function UpgradeDialog({
	open,
	onOpenChange,
	resource,
	limit,
}: UpgradeDialogProps) {
	const [isLoading, setIsLoading] = useState(false)

	async function handleUpgrade() {
		setIsLoading(true)
		try {
			const { url } = await api.billing.createCheckout(
				`${window.location.origin}/settings/billing?success=true`,
				window.location.href,
			)
			window.location.href = url
		} catch (error) {
			console.error("Failed to create checkout:", error)
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						Upgrade to Pro
					</DialogTitle>
					<DialogDescription>
						You've reached the limit of {limit} {resource} on the Free plan.
						Upgrade to Pro for more capacity.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
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
							$12/month
						</li>
					</ul>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Maybe later
					</Button>
					<Button
						onClick={handleUpgrade}
						disabled={isLoading}
						className="gap-2"
					>
						<Sparkles className="h-4 w-4" />
						{isLoading ? "Redirecting..." : "Upgrade Now"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
