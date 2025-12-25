"use client"

import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type EmptyStateProps = {
	icon: LucideIcon
	title: string
	description: string
	action?: {
		label: string
		onClick: () => void
	}
	secondaryAction?: ReactNode
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	secondaryAction,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
				<Icon className="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 className="font-display text-lg font-medium mb-1">{title}</h3>
			<p className="text-muted-foreground text-sm max-w-sm mb-6">
				{description}
			</p>
			{action && <Button onClick={action.onClick}>{action.label}</Button>}
			{secondaryAction && (
				<div className="mt-3 text-sm text-muted-foreground">
					{secondaryAction}
				</div>
			)}
		</div>
	)
}
