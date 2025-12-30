"use client"

import { PaginationControls } from "@/components/pagination-controls"
import { Badge } from "@/components/ui/badge"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { HttpMonitorAlert, HttpMonitorAlertEvent } from "@/lib/api"
import { useHttpMonitorAlerts } from "@/lib/query"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, Bell, Check, X } from "lucide-react"
import { useState } from "react"

const DEFAULT_LIMIT = 20

const EVENT_OPTIONS: { value: HttpMonitorAlertEvent | "ALL"; label: string }[] =
	[
		{ value: "ALL", label: "All events" },
		{ value: "httpMonitor.down", label: "Down" },
		{ value: "httpMonitor.up", label: "Recovered" },
	]

type HttpMonitorAlertsTabProps = {
	httpMonitorId: string
}

function getEventLabel(event: string): string {
	switch (event) {
		case "httpMonitor.down":
			return "Down"
		case "httpMonitor.up":
			return "Recovered"
		default:
			return event
	}
}

function getEventIcon(event: string) {
	switch (event) {
		case "httpMonitor.down":
			return <AlertTriangle className="size-4" />
		case "httpMonitor.up":
			return <Check className="size-4" />
		default:
			return <Bell className="size-4" />
	}
}

function getEventColor(event: string): string {
	switch (event) {
		case "httpMonitor.down":
			return "text-destructive bg-destructive/10"
		case "httpMonitor.up":
			return "text-green-500 bg-green-500/10"
		default:
			return "text-muted-foreground bg-muted"
	}
}

function HttpMonitorAlertTable({ alerts }: { alerts: HttpMonitorAlert[] }) {
	if (alerts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Bell className="size-8 text-muted-foreground mb-3" />
				<p className="text-muted-foreground">No alerts yet</p>
				<p className="text-xs text-muted-foreground mt-1">
					Alerts will appear here when this HTTP monitor triggers notifications
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
						<th className="py-3 px-4 font-medium">Time</th>
						<th className="py-3 px-4 font-medium">Channels</th>
						<th className="py-3 px-4 font-medium">Status</th>
					</tr>
				</thead>
				<tbody>
					{alerts.map((alert) => (
						<tr
							key={alert.id}
							className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
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
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export function HttpMonitorAlertsTab({
	httpMonitorId,
}: HttpMonitorAlertsTabProps) {
	const [page, setPage] = useState(1)
	const [event, setEvent] = useState<HttpMonitorAlertEvent | undefined>(
		undefined,
	)

	const { data, isLoading } = useHttpMonitorAlerts(httpMonitorId, {
		page,
		limit: DEFAULT_LIMIT,
		event,
	})

	function handleEventChange(value: string) {
		setEvent(value === "ALL" ? undefined : (value as HttpMonitorAlertEvent))
		setPage(1)
	}

	if (isLoading) {
		return <Skeleton className="h-48" />
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Select value={event ?? "ALL"} onValueChange={handleEventChange}>
					<SelectTrigger className="w-36">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{EVENT_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<HttpMonitorAlertTable alerts={data?.alerts ?? []} />
			{data && data.totalPages > 1 && (
				<PaginationControls
					page={page}
					totalPages={data.totalPages}
					onPageChange={setPage}
				/>
			)}
		</div>
	)
}
