"use client"

import { EmptyState } from "@/components/empty-state"
import type { Check } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ChevronRight, Clock } from "lucide-react"
import Link from "next/link"
import { PingSparkline } from "./ping-sparkline"
import { StatusBadge, statusColors } from "./status-badge"

type CheckTableProps = {
	checks: Check[]
	projectId: string
	onEdit?: (check: Check) => void
	onAdd?: () => void
}

function formatSchedule(check: Check): string {
	if (check.scheduleType === "CRON") {
		return check.scheduleValue
	}
	const seconds = Number.parseInt(check.scheduleValue, 10)
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
	return `${Math.floor(seconds / 86400)}d`
}

function getRowClassName(status: Check["status"]): string {
	switch (status) {
		case "LATE":
			return "bg-amber-950/20 hover:bg-amber-950/30"
		case "DOWN":
			return "bg-red-950/20 hover:bg-red-950/30"
		case "PAUSED":
			return "opacity-50 hover:bg-secondary/30"
		default:
			return "hover:bg-secondary/30"
	}
}

export function CheckTable({ checks, onAdd }: CheckTableProps) {
	if (checks.length === 0) {
		return (
			<EmptyState
				icon={Clock}
				title="No checks yet"
				description="Checks monitor your cron jobs and alert you when they miss a beat."
				action={onAdd ? { label: "Add check", onClick: onAdd } : undefined}
			/>
		)
	}

	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<table className="w-full text-sm text-left">
				<thead>
					<tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
						<th className="py-3 px-4 font-medium">Check</th>
						<th className="py-3 px-4 font-medium">Status</th>
						<th className="py-3 px-4 font-medium font-mono">Schedule</th>
						<th className="py-3 px-4 font-medium">Last ping</th>
						<th className="py-3 px-4 font-medium">Recent</th>
						<th className="py-3 px-4 w-10" />
					</tr>
				</thead>
				<tbody className="divide-y divide-border/50">
					{checks.map((check) => {
						const isOverdue = check.status === "LATE" || check.status === "DOWN"
						return (
							<tr
								key={check.id}
								className={cn(
									"cursor-pointer transition-colors",
									getRowClassName(check.status),
								)}
							>
								<td className="py-3 px-4">
									<Link href={`/checks/${check.id}`} className="block">
										<p className="font-medium text-foreground">{check.name}</p>
										{check.slug && (
											<p className="text-xs text-muted-foreground font-mono">
												/{check.slug}
											</p>
										)}
									</Link>
								</td>
								<td className="py-3 px-4">
									<StatusBadge status={check.status} />
								</td>
								<td className="py-3 px-4 font-mono text-xs text-muted-foreground">
									{formatSchedule(check)}
								</td>
								<td
									className={cn(
										"py-3 px-4",
										isOverdue
											? statusColors[check.status]
											: "text-muted-foreground",
									)}
								>
									{check.lastPingAt
										? formatRelativeCompactAgo(check.lastPingAt)
										: "Never"}
								</td>
								<td className="py-3 px-4">
									<PingSparkline sparkline={check.sparkline} />
								</td>
								<td className="py-3 px-4">
									<Link href={`/checks/${check.id}`}>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</Link>
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}
