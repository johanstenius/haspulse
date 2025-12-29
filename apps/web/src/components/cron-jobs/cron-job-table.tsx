"use client"

import { EmptyState } from "@/components/empty-state"
import type { CronJob } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ChevronRight, Clock } from "lucide-react"
import Link from "next/link"
import { PingSparkline } from "./ping-sparkline"
import { StatusBadge, statusColors } from "./status-badge"

type CronJobTableProps = {
	cronJobs: CronJob[]
	onAdd?: () => void
}

function formatSchedule(cronJob: CronJob): string {
	if (cronJob.scheduleType === "CRON") {
		return cronJob.scheduleValue
	}
	const seconds = Number.parseInt(cronJob.scheduleValue, 10)
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
	return `${Math.floor(seconds / 86400)}d`
}

function getRowClassName(status: CronJob["status"]): string {
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

export function CronJobTable({ cronJobs, onAdd }: CronJobTableProps) {
	if (cronJobs.length === 0) {
		return (
			<EmptyState
				icon={Clock}
				title="Start monitoring"
				description="Add your first cron job to track scheduled tasks, background workers, and pipelines."
				action={onAdd ? { label: "Add cron job", onClick: onAdd } : undefined}
			/>
		)
	}

	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<table className="w-full text-sm text-left">
				<thead>
					<tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
						<th className="py-3 px-4 font-medium">Cron Job</th>
						<th className="py-3 px-4 font-medium">Status</th>
						<th className="py-3 px-4 font-medium font-mono">Schedule</th>
						<th className="py-3 px-4 font-medium">Last ping</th>
						<th className="py-3 px-4 font-medium">Recent</th>
						<th className="py-3 px-4 w-10" />
					</tr>
				</thead>
				<tbody className="divide-y divide-border/50">
					{cronJobs.map((cronJob) => {
						const isOverdue =
							cronJob.status === "LATE" || cronJob.status === "DOWN"
						return (
							<tr
								key={cronJob.id}
								className={cn(
									"cursor-pointer transition-colors",
									getRowClassName(cronJob.status),
								)}
							>
								<td className="py-3 px-4">
									<Link href={`/cron-jobs/${cronJob.id}`} className="block">
										<p className="font-medium text-foreground">
											{cronJob.name}
										</p>
										{cronJob.slug && (
											<p className="text-xs text-muted-foreground font-mono">
												/{cronJob.slug}
											</p>
										)}
									</Link>
								</td>
								<td className="py-3 px-4">
									<StatusBadge status={cronJob.status} />
								</td>
								<td className="py-3 px-4 font-mono text-xs text-muted-foreground">
									{formatSchedule(cronJob)}
								</td>
								<td
									className={cn(
										"py-3 px-4",
										isOverdue
											? statusColors[cronJob.status]
											: "text-muted-foreground",
									)}
								>
									{cronJob.lastPingAt
										? formatRelativeCompactAgo(cronJob.lastPingAt)
										: "Never"}
								</td>
								<td className="py-3 px-4">
									<PingSparkline sparkline={cronJob.sparkline} />
								</td>
								<td className="py-3 px-4">
									<Link href={`/cron-jobs/${cronJob.id}`}>
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
