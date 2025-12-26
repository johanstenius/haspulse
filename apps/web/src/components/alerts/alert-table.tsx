"use client"

import { Badge } from "@/components/ui/badge"
import type { Alert, AlertWithCheck } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, Bell, Check, ChevronRight, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { AlertContextPanel } from "./alert-context-panel"

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
		default:
			return "text-muted-foreground bg-muted"
	}
}

function isAlertWithCheck(
	alert: Alert | AlertWithCheck,
): alert is AlertWithCheck {
	return "checkName" in alert
}

export function AlertTable<T extends Alert | AlertWithCheck>({
	alerts,
	showCheckColumn = false,
}: AlertTableProps<T>) {
	const [selectedAlert, setSelectedAlert] = useState<T | null>(null)

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
		<>
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
						{alerts.map((alert) => (
							<tr
								key={alert.id}
								className="cursor-pointer hover:bg-secondary/30 transition-colors"
								tabIndex={0}
								onClick={() => setSelectedAlert(alert)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault()
										setSelectedAlert(alert)
									}
								}}
							>
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
								{showCheckColumn && isAlertWithCheck(alert) && (
									<td className="py-3 px-4">
										<Link
											href={`/checks/${alert.checkId}`}
											className="hover:underline text-primary"
											onClick={(e) => e.stopPropagation()}
										>
											{alert.checkName}
										</Link>
										<p className="text-xs text-muted-foreground">
											{alert.projectName}
										</p>
									</td>
								)}
								<td className="py-3 px-4 text-muted-foreground">
									{formatDistanceToNow(new Date(alert.createdAt), {
										addSuffix: true,
									})}
								</td>
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
								<td className="py-3 px-4">
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<AlertContextPanel
				alert={selectedAlert}
				open={selectedAlert !== null}
				onOpenChange={(open) => {
					if (!open) setSelectedAlert(null)
				}}
			/>
		</>
	)
}
