"use client"

import { Badge } from "@/components/ui/badge"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import type { Alert, AlertWithCheck } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
	AlertTriangle,
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Clock,
	Link2,
	Minus,
} from "lucide-react"
import Link from "next/link"

type AlertContextPanelProps = {
	alert: Alert | AlertWithCheck | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
	return `${(ms / 60000).toFixed(1)}m`
}

function TrendIcon({ direction }: { direction: string }) {
	switch (direction) {
		case "increasing":
			return <ArrowUp className="size-4 text-amber-500" />
		case "decreasing":
			return <ArrowDown className="size-4 text-green-500" />
		case "stable":
			return <Minus className="size-4 text-muted-foreground" />
		default:
			return <ArrowRight className="size-4 text-muted-foreground" />
	}
}

function DurationBar({
	durations,
	avgMs,
}: { durations: number[]; avgMs: number | null }) {
	if (durations.length === 0) return null

	const max = Math.max(...durations)

	return (
		<div className="space-y-1">
			<div className="flex items-end gap-1 h-8">
				{durations.map((d, i) => {
					const height = max > 0 ? (d / max) * 100 : 50
					const isAboveAvg = avgMs && d > avgMs
					const isLatest = i === durations.length - 1
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size historical array
							key={i}
							className={cn(
								"w-6 rounded-t transition-all",
								isAboveAvg ? "bg-amber-500" : "bg-primary",
								isLatest &&
									"ring-1 ring-primary ring-offset-1 ring-offset-background",
							)}
							style={{ height: `${Math.max(height, 10)}%` }}
							title={formatDuration(d)}
						/>
					)
				})}
			</div>
			<div className="flex gap-1">
				{durations.map((d, i) => (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size historical array
						key={i}
						className={cn(
							"w-6 text-[10px] text-center font-mono",
							i === durations.length - 1
								? "text-primary font-medium"
								: "text-muted-foreground",
						)}
					>
						{formatDuration(d)}
					</span>
				))}
			</div>
		</div>
	)
}

function DurationSection({ duration }: { duration: Alert["context"] }) {
	if (!duration?.duration) return null

	const {
		lastDurationMs,
		last5Durations,
		avgDurationMs,
		trendDirection,
		isAnomaly,
		anomalyType,
		zScore,
	} = duration.duration

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Clock className="size-4 text-muted-foreground" />
				<span className="font-medium">Duration</span>
				{isAnomaly && (
					<Badge variant="destructive" className="text-xs">
						{anomalyType === "zscore"
							? `Anomaly (z=${zScore?.toFixed(1)})`
							: "Drift detected"}
					</Badge>
				)}
			</div>
			<div className="pl-6 space-y-2">
				<div className="flex items-center gap-4 text-sm">
					<div>
						<span className="text-muted-foreground">Last:</span>{" "}
						<span className="font-mono">
							{lastDurationMs !== null ? formatDuration(lastDurationMs) : "N/A"}
						</span>
					</div>
					<div>
						<span className="text-muted-foreground">Avg:</span>{" "}
						<span className="font-mono">
							{avgDurationMs !== null ? formatDuration(avgDurationMs) : "N/A"}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<span className="text-muted-foreground">Trend:</span>
						<TrendIcon direction={trendDirection} />
					</div>
				</div>
				{last5Durations.length > 0 && (
					<DurationBar durations={last5Durations} avgMs={avgDurationMs} />
				)}
			</div>
		</div>
	)
}

function ErrorSection({ errorPattern }: { errorPattern: Alert["context"] }) {
	if (!errorPattern?.errorPattern) return null

	const { lastErrorSnippet, errorCount24h } = errorPattern.errorPattern

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<AlertTriangle className="size-4 text-muted-foreground" />
				<span className="font-medium">Error Pattern</span>
				{errorCount24h > 0 && (
					<Badge variant="secondary" className="text-xs">
						{errorCount24h} errors (24h)
					</Badge>
				)}
			</div>
			{lastErrorSnippet && (
				<div className="pl-6">
					<pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap break-all max-h-32">
						{lastErrorSnippet}
					</pre>
				</div>
			)}
		</div>
	)
}

function CorrelationSection({
	correlation,
}: { correlation: Alert["context"] }) {
	if (!correlation?.correlation?.relatedFailures?.length) return null

	const { relatedFailures } = correlation.correlation

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Link2 className="size-4 text-muted-foreground" />
				<span className="font-medium">Related Failures</span>
				<Badge variant="secondary" className="text-xs">
					{relatedFailures.length} check{relatedFailures.length > 1 ? "s" : ""}
				</Badge>
			</div>
			<div className="pl-6 space-y-1">
				{relatedFailures.map((failure) => (
					<Link
						key={failure.checkId}
						href={`/checks/${failure.checkId}`}
						className="flex items-center justify-between text-sm hover:bg-muted p-1 rounded-md transition-colors"
					>
						<span className="text-primary hover:underline">
							{failure.checkName}
						</span>
						<span className="text-muted-foreground text-xs">
							{formatDistanceToNow(new Date(failure.failedAt), {
								addSuffix: true,
							})}
						</span>
					</Link>
				))}
			</div>
		</div>
	)
}

function getEventLabel(event: string): string {
	switch (event) {
		case "check.down":
			return "Check Down"
		case "check.up":
			return "Check Recovered"
		case "check.still_down":
			return "Still Down"
		default:
			return event
	}
}

function getEventColor(event: string): string {
	switch (event) {
		case "check.down":
			return "text-destructive"
		case "check.up":
			return "text-green-500"
		case "check.still_down":
			return "text-amber-500"
		default:
			return "text-muted-foreground"
	}
}

export function AlertContextPanel({
	alert,
	open,
	onOpenChange,
}: AlertContextPanelProps) {
	if (!alert) return null

	const hasContext =
		alert.context?.duration ||
		alert.context?.errorPattern ||
		alert.context?.correlation?.relatedFailures?.length

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-md overflow-y-auto">
				<SheetHeader>
					<SheetTitle
						className={cn(
							"flex items-center gap-2",
							getEventColor(alert.event),
						)}
					>
						{getEventLabel(alert.event)}
					</SheetTitle>
					<SheetDescription>
						{formatDistanceToNow(new Date(alert.createdAt), {
							addSuffix: true,
						})}
						{" · "}
						{alert.success ? (
							<span className="text-green-500">Delivered</span>
						) : (
							<span className="text-destructive">Failed</span>
						)}
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-6 p-4 pt-0">
					{alert.channels.length > 0 && (
						<div className="space-y-2">
							<span className="text-sm font-medium">Channels</span>
							<div className="flex flex-wrap gap-1">
								{alert.channels.map((channel) => (
									<Badge key={channel.id} variant="outline" className="text-xs">
										{channel.name}
									</Badge>
								))}
							</div>
						</div>
					)}

					{alert.error && (
						<div className="space-y-2">
							<span className="text-sm font-medium text-destructive">
								Error
							</span>
							<pre className="text-xs bg-destructive/10 text-destructive p-2 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
								{alert.error}
							</pre>
						</div>
					)}

					{hasContext && (
						<>
							<div className="border-t pt-4">
								<span className="text-sm font-medium text-muted-foreground">
									Context
								</span>
							</div>
							<DurationSection duration={alert.context} />
							<ErrorSection errorPattern={alert.context} />
							<CorrelationSection correlation={alert.context} />
						</>
					)}

					{!hasContext && !alert.error && (
						<p className="text-sm text-muted-foreground text-center py-4">
							No additional context available
						</p>
					)}
				</div>
			</SheetContent>
		</Sheet>
	)
}
