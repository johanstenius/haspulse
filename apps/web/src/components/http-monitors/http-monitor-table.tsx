"use client"

import { EmptyState } from "@/components/empty-state"
import type { HttpMonitor } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ChevronRight, Globe } from "lucide-react"
import Link from "next/link"
import { PingSparkline } from "../cron-jobs/ping-sparkline"
import { StatusBadge, statusColors } from "../cron-jobs/status-badge"

type HttpMonitorTableProps = {
	httpMonitors: HttpMonitor[]
	onAdd?: () => void
}

function getRowClassName(status: HttpMonitor["status"]): string {
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

function formatInterval(seconds: number): string {
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	return `${Math.floor(seconds / 3600)}h`
}

export function HttpMonitorTable({
	httpMonitors,
	onAdd,
}: HttpMonitorTableProps) {
	if (httpMonitors.length === 0) {
		return (
			<EmptyState
				icon={Globe}
				title="Start monitoring"
				description="Add your first HTTP monitor to check endpoint availability and response times."
				action={
					onAdd ? { label: "Add HTTP monitor", onClick: onAdd } : undefined
				}
			/>
		)
	}

	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<table className="w-full text-sm text-left">
				<thead>
					<tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
						<th className="py-3 px-4 font-medium">Endpoint</th>
						<th className="py-3 px-4 font-medium">Status</th>
						<th className="py-3 px-4 font-medium">Interval</th>
						<th className="py-3 px-4 font-medium">Last check</th>
						<th className="py-3 px-4 font-medium">Response</th>
						<th className="py-3 px-4 font-medium">Recent</th>
						<th className="py-3 px-4 w-10" />
					</tr>
				</thead>
				<tbody className="divide-y divide-border/50">
					{httpMonitors.map((monitor) => {
						const isOverdue =
							monitor.status === "LATE" || monitor.status === "DOWN"
						return (
							<tr
								key={monitor.id}
								className={cn(
									"cursor-pointer transition-colors",
									getRowClassName(monitor.status),
								)}
							>
								<td className="py-3 px-4">
									<Link href={`/http-monitors/${monitor.id}`} className="block">
										<p className="font-medium text-foreground">
											{monitor.name}
										</p>
										<p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
											{monitor.method} {new URL(monitor.url).hostname}
										</p>
									</Link>
								</td>
								<td className="py-3 px-4">
									<StatusBadge status={monitor.status} />
								</td>
								<td className="py-3 px-4 text-xs text-muted-foreground">
									{formatInterval(monitor.interval)}
								</td>
								<td
									className={cn(
										"py-3 px-4",
										isOverdue
											? statusColors[monitor.status]
											: "text-muted-foreground",
									)}
								>
									{monitor.lastCheckedAt
										? formatRelativeCompactAgo(monitor.lastCheckedAt)
										: "Never"}
								</td>
								<td className="py-3 px-4 text-xs text-muted-foreground font-mono">
									{monitor.lastResponseMs !== null
										? `${monitor.lastResponseMs}ms`
										: "-"}
								</td>
								<td className="py-3 px-4">
									<PingSparkline sparkline={monitor.sparkline} />
								</td>
								<td className="py-3 px-4">
									<Link href={`/http-monitors/${monitor.id}`}>
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
