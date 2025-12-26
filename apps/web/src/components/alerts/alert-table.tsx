"use client"

import { Badge } from "@/components/ui/badge"
import type { Alert, AlertWithCheck } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
	AlertTriangle,
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Bell,
	Check,
	ChevronDown,
	ChevronRight,
	Clock,
	Link2,
	Minus,
	X,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

type AlertTableProps<T extends Alert | AlertWithCheck> = {
	alerts: T[]
	showCheckColumn?: boolean
}

function getEventLabel(event: string): string {
	switch (event) {
		case "check.down":
			return "Down"
		case "check.up":
			return "Recovered"
		case "check.still_down":
			return "Still Down"
		case "check.fail":
			return "Failed"
		default:
			return event
	}
}

function getEventIcon(event: string) {
	switch (event) {
		case "check.down":
			return <AlertTriangle className="size-4" />
		case "check.up":
			return <Check className="size-4" />
		case "check.still_down":
			return <Bell className="size-4" />
		case "check.fail":
			return <X className="size-4" />
		default:
			return <Bell className="size-4" />
	}
}

function getEventColor(event: string): string {
	switch (event) {
		case "check.down":
			return "text-destructive bg-destructive/10"
		case "check.up":
			return "text-green-500 bg-green-500/10"
		case "check.still_down":
			return "text-amber-500 bg-amber-500/10"
		case "check.fail":
			return "text-red-500 bg-red-500/10"
		default:
			return "text-muted-foreground bg-muted"
	}
}

function isAlertWithCheck(
	alert: Alert | AlertWithCheck,
): alert is AlertWithCheck {
	return "checkName" in alert
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
	return `${(ms / 60000).toFixed(1)}m`
}

function TrendIcon({ direction }: { direction: string }) {
	switch (direction) {
		case "increasing":
			return <ArrowUp className="size-3 text-amber-500" />
		case "decreasing":
			return <ArrowDown className="size-3 text-green-500" />
		case "stable":
			return <Minus className="size-3 text-muted-foreground" />
		default:
			return <ArrowRight className="size-3 text-muted-foreground" />
	}
}

function DurationBar({
	durations,
	avgMs,
}: { durations: number[]; avgMs: number | null }) {
	if (durations.length === 0) return null

	const max = Math.max(...durations)

	return (
		<div className="flex items-end gap-0.5 h-6">
			{durations.map((d, i) => {
				const height = max > 0 ? (d / max) * 100 : 50
				const isAboveAvg = avgMs && d > avgMs
				const isLatest = i === durations.length - 1
				return (
					<div
						key={`bar-${i}-${d}`}
						className={cn(
							"w-3 rounded-sm transition-all",
							isAboveAvg ? "bg-amber-500" : "bg-primary",
							isLatest &&
								"ring-1 ring-primary ring-offset-1 ring-offset-background",
						)}
						style={{ height: `${Math.max(height, 15)}%` }}
						title={formatDuration(d)}
					/>
				)
			})}
		</div>
	)
}

function AlertExpandedContent({ alert }: { alert: Alert | AlertWithCheck }) {
	const duration = alert.context?.duration
	const errorPattern = alert.context?.errorPattern
	const relatedFailures = alert.context?.correlation?.relatedFailures

	if (!duration && !errorPattern && !relatedFailures?.length && !alert.error) {
		return (
			<p className="text-xs text-muted-foreground py-2">
				No additional context
			</p>
		)
	}

	return (
		<div className="flex flex-wrap gap-6 py-3">
			{/* Duration context */}
			{duration && (
				<div className="space-y-2">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Clock className="size-3" />
						<span>Duration</span>
						{duration.isAnomaly && (
							<Badge variant="destructive" className="text-[10px] px-1 py-0">
								{duration.anomalyType === "zscore"
									? `z=${duration.zScore?.toFixed(1)}`
									: "drift"}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-4 text-xs">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">Last:</span>
								<span className="font-mono font-medium">
									{duration.lastDurationMs !== null
										? formatDuration(duration.lastDurationMs)
										: "—"}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">Avg:</span>
								<span className="font-mono">
									{duration.avgDurationMs !== null
										? formatDuration(duration.avgDurationMs)
										: "—"}
								</span>
								<TrendIcon direction={duration.trendDirection} />
							</div>
						</div>
						{duration.last5Durations.length > 0 && (
							<DurationBar
								durations={duration.last5Durations}
								avgMs={duration.avgDurationMs}
							/>
						)}
					</div>
				</div>
			)}

			{/* Error context */}
			{errorPattern?.lastErrorSnippet && (
				<div className="space-y-2 max-w-xs">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<AlertTriangle className="size-3" />
						<span>Last Error</span>
						{errorPattern.errorCount24h > 0 && (
							<Badge variant="secondary" className="text-[10px] px-1 py-0">
								{errorPattern.errorCount24h} in 24h
							</Badge>
						)}
					</div>
					<pre className="text-[10px] bg-muted p-2 rounded-md overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
						{errorPattern.lastErrorSnippet}
					</pre>
				</div>
			)}

			{/* Correlation context */}
			{relatedFailures && relatedFailures.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Link2 className="size-3" />
						<span>Related</span>
						<Badge variant="secondary" className="text-[10px] px-1 py-0">
							{relatedFailures.length}
						</Badge>
					</div>
					<div className="flex flex-wrap gap-1">
						{relatedFailures.slice(0, 3).map((f) => (
							<Link
								key={f.checkId}
								href={`/checks/${f.checkId}`}
								className="text-[10px] text-primary hover:underline"
							>
								{f.checkName}
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Delivery error */}
			{alert.error && (
				<div className="space-y-2 max-w-xs">
					<div className="flex items-center gap-1.5 text-xs text-destructive">
						<X className="size-3" />
						<span>Delivery Error</span>
					</div>
					<pre className="text-[10px] bg-destructive/10 text-destructive p-2 rounded-md overflow-hidden text-ellipsis whitespace-nowrap">
						{alert.error}
					</pre>
				</div>
			)}
		</div>
	)
}

export function AlertTable<T extends Alert | AlertWithCheck>({
	alerts,
	showCheckColumn = false,
}: AlertTableProps<T>) {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

	function toggleExpanded(id: string) {
		setExpandedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	if (alerts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Bell className="size-8 text-muted-foreground mb-3" />
				<p className="text-muted-foreground">No alerts yet</p>
				<p className="text-xs text-muted-foreground mt-1">
					Alerts will appear here when your checks trigger notifications
				</p>
			</div>
		)
	}

	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<table className="w-full text-sm text-left">
				<thead>
					<tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
						<th className="py-3 px-4 font-medium">Event</th>
						{showCheckColumn && (
							<th className="py-3 px-4 font-medium">Check</th>
						)}
						<th className="py-3 px-4 font-medium">Time</th>
						<th className="py-3 px-4 font-medium">Channels</th>
						<th className="py-3 px-4 font-medium">Status</th>
						<th className="py-3 px-4 w-10" />
					</tr>
				</thead>
				<tbody className="divide-y divide-border/50">
					{alerts.map((alert) => {
						const isExpanded = expandedIds.has(alert.id)
						return (
							<tr
								key={alert.id}
								className="cursor-pointer hover:bg-secondary/30 transition-colors"
								tabIndex={0}
								onClick={() => toggleExpanded(alert.id)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault()
										toggleExpanded(alert.id)
									}
								}}
							>
								<td className="py-3 px-4" colSpan={showCheckColumn ? 6 : 5}>
									<div className="flex items-center gap-4">
										{/* Event badge */}
										<div
											className={cn(
												"inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium shrink-0",
												getEventColor(alert.event),
											)}
										>
											{getEventIcon(alert.event)}
											{getEventLabel(alert.event)}
										</div>

										{/* Check name (if showing) */}
										{showCheckColumn && isAlertWithCheck(alert) && (
											<div className="min-w-0 shrink-0">
												<Link
													href={`/checks/${alert.checkId}`}
													className="hover:underline text-primary text-sm"
													onClick={(e) => e.stopPropagation()}
												>
													{alert.checkName}
												</Link>
												<p className="text-xs text-muted-foreground truncate">
													{alert.projectName}
												</p>
											</div>
										)}

										{/* Time */}
										<span className="text-muted-foreground text-sm shrink-0">
											{formatDistanceToNow(new Date(alert.createdAt), {
												addSuffix: true,
											})}
										</span>

										{/* Channels */}
										<div className="flex flex-wrap gap-1 shrink-0">
											{alert.channels.slice(0, 2).map((channel) => (
												<Badge
													key={channel.id}
													variant="outline"
													className="text-xs"
												>
													{channel.name}
												</Badge>
											))}
											{alert.channels.length > 2 && (
												<Badge variant="outline" className="text-xs">
													+{alert.channels.length - 2}
												</Badge>
											)}
										</div>

										{/* Status */}
										<div className="shrink-0">
											{alert.success ? (
												<span className="inline-flex items-center gap-1 text-green-500 text-xs">
													<Check className="size-3" />
													Sent
												</span>
											) : (
												<span className="inline-flex items-center gap-1 text-destructive text-xs">
													<X className="size-3" />
													Failed
												</span>
											)}
										</div>

										{/* Expand indicator - push to right */}
										<div className="ml-auto">
											{isExpanded ? (
												<ChevronDown className="h-4 w-4 text-muted-foreground" />
											) : (
												<ChevronRight className="h-4 w-4 text-muted-foreground" />
											)}
										</div>
									</div>

									{/* Expanded content */}
									{isExpanded && (
										<div className="mt-2 pt-2 border-t border-border/50">
											<AlertExpandedContent alert={alert} />
										</div>
									)}
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}
