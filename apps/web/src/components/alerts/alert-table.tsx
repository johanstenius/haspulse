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
import { Fragment, useState } from "react"

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
		<div className="flex items-end gap-1 h-8 px-2 py-1.5 bg-background/50 rounded-md">
			{durations.map((d, i) => {
				const height = max > 0 ? (d / max) * 100 : 50
				const isAboveAvg = avgMs && d > avgMs
				const isLatest = i === durations.length - 1
				return (
					<div
						key={`bar-${i}-${d}`}
						className={cn(
							"w-2.5 rounded-sm transition-all",
							isAboveAvg ? "bg-amber-500" : "bg-emerald-500",
							isLatest && "bg-primary",
						)}
						style={{ height: `${Math.max(height, 20)}%` }}
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
			<p className="text-xs text-muted-foreground py-3 pl-4">
				No additional context
			</p>
		)
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 py-3 pl-4">
			{/* Duration context */}
			{duration && (
				<div className="bg-background/60 rounded-lg p-3 space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
							<Clock className="size-3.5" />
							<span>Duration</span>
						</div>
						{duration.isAnomaly && (
							<Badge variant="destructive" className="text-[10px] px-1.5 py-0">
								{duration.anomalyType === "zscore"
									? `z=${duration.zScore?.toFixed(1)}`
									: "drift"}
							</Badge>
						)}
					</div>
					<div className="flex items-center justify-between gap-3">
						<div className="space-y-0.5 text-xs">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground w-8">Last</span>
								<span className="font-mono font-semibold text-foreground">
									{duration.lastDurationMs !== null
										? formatDuration(duration.lastDurationMs)
										: "—"}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground w-8">Avg</span>
								<span className="font-mono text-muted-foreground">
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
				<div className="bg-background/60 rounded-lg p-3 space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
							<AlertTriangle className="size-3.5" />
							<span>Last Error</span>
						</div>
						{errorPattern.errorCount24h > 0 && (
							<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
								{errorPattern.errorCount24h} in 24h
							</Badge>
						)}
					</div>
					<pre className="text-[10px] bg-muted/50 p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap font-mono text-muted-foreground">
						{errorPattern.lastErrorSnippet}
					</pre>
				</div>
			)}

			{/* Correlation context */}
			{relatedFailures && relatedFailures.length > 0 && (
				<div className="bg-background/60 rounded-lg p-3 space-y-2">
					<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
						<Link2 className="size-3.5" />
						<span>Related Failures</span>
						<Badge
							variant="secondary"
							className="text-[10px] px-1.5 py-0 ml-auto"
						>
							{relatedFailures.length}
						</Badge>
					</div>
					<div className="flex flex-wrap gap-1.5">
						{relatedFailures.slice(0, 3).map((f) => (
							<Link
								key={f.checkId}
								href={`/checks/${f.checkId}`}
								className="text-xs text-primary hover:underline bg-primary/5 px-2 py-0.5 rounded"
								onClick={(e) => e.stopPropagation()}
							>
								{f.checkName}
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Delivery error */}
			{alert.error && (
				<div className="bg-destructive/5 rounded-lg p-3 space-y-2 border border-destructive/20">
					<div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
						<X className="size-3.5" />
						<span>Delivery Failed</span>
					</div>
					<pre className="text-[10px] bg-destructive/10 p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap font-mono text-destructive">
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

	const colCount = showCheckColumn ? 6 : 5

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
				<tbody>
					{alerts.map((alert) => {
						const isExpanded = expandedIds.has(alert.id)
						return (
							<Fragment key={alert.id}>
								<tr
									className={cn(
										"cursor-pointer hover:bg-secondary/30 transition-colors border-b border-border/50",
										isExpanded && "bg-secondary/20",
									)}
									tabIndex={0}
									onClick={() => toggleExpanded(alert.id)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault()
											toggleExpanded(alert.id)
										}
									}}
								>
									{/* Event */}
									<td className="py-3 px-4">
										<div
											className={cn(
												"inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
												getEventColor(alert.event),
											)}
										>
											{getEventIcon(alert.event)}
											{getEventLabel(alert.event)}
										</div>
									</td>

									{/* Check (optional) */}
									{showCheckColumn && (
										<td className="py-3 px-4">
											{isAlertWithCheck(alert) && (
												<div className="min-w-0">
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
										</td>
									)}

									{/* Time */}
									<td className="py-3 px-4 text-muted-foreground">
										{formatDistanceToNow(new Date(alert.createdAt), {
											addSuffix: true,
										})}
									</td>

									{/* Channels */}
									<td className="py-3 px-4">
										<div className="flex flex-wrap gap-1">
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
									</td>

									{/* Status */}
									<td className="py-3 px-4">
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
									</td>

									{/* Expand */}
									<td className="py-3 px-4">
										{isExpanded ? (
											<ChevronDown className="size-4 text-muted-foreground" />
										) : (
											<ChevronRight className="size-4 text-muted-foreground" />
										)}
									</td>
								</tr>

								{/* Expanded row */}
								{isExpanded && (
									<tr className="bg-secondary/10 border-b border-border/50">
										<td colSpan={colCount} className="px-4 pb-3">
											<AlertExpandedContent alert={alert} />
										</td>
									</tr>
								)}
							</Fragment>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}
