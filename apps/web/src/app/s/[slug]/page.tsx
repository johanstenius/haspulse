import type {
	ComponentStatus,
	IncidentStatus,
	PublicIncident,
	PublicMaintenance,
	PublicStatusPage,
	StatusPageTheme,
	UptimeDay,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function getStatusPage(slug: string): Promise<PublicStatusPage | null> {
	const res = await fetch(`${API_URL}/status/${slug}`, {
		next: { revalidate: 30 },
	})

	if (!res.ok) {
		if (res.status === 404) return null
		throw new Error("Failed to fetch status page")
	}

	return res.json()
}

type PageProps = {
	params: Promise<{ slug: string }>
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const statusPage = await getStatusPage(slug)

	if (!statusPage) {
		return { title: "Status Page Not Found" }
	}

	return {
		title: statusPage.name,
		description:
			statusPage.description ?? `System status for ${statusPage.name}`,
	}
}

function getStatusConfig(status: ComponentStatus): {
	label: string
	textClass: string
	dotClass: string
} {
	switch (status) {
		case "operational":
			return {
				label: "Operational",
				textClass: "text-emerald-600 dark:text-emerald-400",
				dotClass: "bg-emerald-500",
			}
		case "degraded":
			return {
				label: "Degraded",
				textClass: "text-amber-600 dark:text-amber-400",
				dotClass: "bg-amber-500",
			}
		case "partial_outage":
			return {
				label: "Partial Outage",
				textClass: "text-orange-600 dark:text-orange-400",
				dotClass: "bg-orange-500",
			}
		case "major_outage":
			return {
				label: "Major Outage",
				textClass: "text-red-600 dark:text-red-400",
				dotClass: "bg-red-500",
			}
	}
}

function getOverallStatusMessage(status: ComponentStatus): string {
	switch (status) {
		case "operational":
			return "All Systems Operational"
		case "degraded":
			return "Some Systems Degraded"
		case "partial_outage":
			return "Partial System Outage"
		case "major_outage":
			return "Major System Outage"
	}
}

function getThemeClass(theme: StatusPageTheme): string {
	switch (theme) {
		case "LIGHT":
			return "light"
		case "DARK":
			return "dark"
		default:
			return ""
	}
}

function StatusIndicator({
	status,
	accentColor,
}: { status: ComponentStatus; accentColor: string }) {
	const config = getStatusConfig(status)
	const isOperational = status === "operational"

	return (
		<span className="relative flex h-2.5 w-2.5">
			{isOperational && (
				<span
					className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
					style={{ backgroundColor: accentColor }}
				/>
			)}
			<span
				className={cn("relative inline-flex h-2.5 w-2.5 rounded-full")}
				style={isOperational ? { backgroundColor: accentColor } : undefined}
			/>
			{!isOperational && (
				<span
					className={cn("absolute inset-0 rounded-full", config.dotClass)}
				/>
			)}
		</span>
	)
}

function getUptimeBarColor(upPercent: number, accentColor: string): string {
	if (upPercent >= 99) return accentColor
	if (upPercent >= 95) return "#f59e0b"
	if (upPercent > 0) return "#ef4444"
	return "transparent"
}

function formatDaysLabel(daysWithData: number): string {
	if (daysWithData === 0) return "Monitoring started"
	if (daysWithData === 1) return "1 day"
	return `${daysWithData} days`
}

function UptimeBar({
	uptimeHistory,
	accentColor,
}: { uptimeHistory: UptimeDay[]; accentColor: string }) {
	// Filter to only days with actual data
	const daysWithData = uptimeHistory.filter((d) => d.upPercent > 0)
	const hasData = daysWithData.length > 0

	// Calculate uptime only from days with data
	const avgUptime = hasData
		? daysWithData.reduce((sum, d) => sum + d.upPercent, 0) /
			daysWithData.length
		: null

	const displayDays = uptimeHistory.slice(-90)

	return (
		<div className="mt-3">
			<div className="flex h-7 items-end gap-px">
				{displayDays.map((day) => {
					const hasDataForDay = day.upPercent > 0

					return (
						<div
							key={day.date}
							className={cn(
								"h-7 flex-1 rounded-sm",
								hasDataForDay ? "" : "bg-muted/40 dark:bg-muted/30",
							)}
							style={
								hasDataForDay
									? {
											backgroundColor: getUptimeBarColor(
												day.upPercent,
												accentColor,
											),
										}
									: undefined
							}
							title={
								hasDataForDay
									? `${day.date}: ${day.upPercent.toFixed(1)}%`
									: `${day.date}: No data`
							}
						/>
					)
				})}
			</div>
			<div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
				<span>{formatDaysLabel(daysWithData.length)}</span>
				{avgUptime !== null ? (
					<span className="font-medium">{avgUptime.toFixed(2)}% uptime</span>
				) : (
					<span>Collecting data...</span>
				)}
			</div>
		</div>
	)
}

function ComponentCard({
	displayName,
	status,
	uptimeHistory,
	accentColor,
}: {
	displayName: string
	status: ComponentStatus
	uptimeHistory: UptimeDay[]
	accentColor: string
}) {
	const config = getStatusConfig(status)

	return (
		<div className="rounded-lg border border-border/50 bg-card px-5 py-4">
			<div className="flex items-center justify-between">
				<span className="font-medium">{displayName}</span>
				<div className="flex items-center gap-2">
					<span className={cn("text-sm font-medium", config.textClass)}>
						{config.label}
					</span>
					<StatusIndicator status={status} accentColor={accentColor} />
				</div>
			</div>
			<UptimeBar uptimeHistory={uptimeHistory} accentColor={accentColor} />
		</div>
	)
}

function OverallStatusBanner({
	status,
	accentColor,
}: { status: ComponentStatus; accentColor: string }) {
	const config = getStatusConfig(status)
	const message = getOverallStatusMessage(status)
	const isOperational = status === "operational"

	return (
		<div
			className="rounded-xl px-6 py-5 text-center"
			style={{
				backgroundColor: isOperational
					? `${accentColor}12`
					: status === "degraded"
						? "#f59e0b12"
						: status === "partial_outage"
							? "#f9731612"
							: "#ef444412",
			}}
		>
			<div className="flex items-center justify-center gap-3">
				<StatusIndicator status={status} accentColor={accentColor} />
				<span
					className={cn(
						"text-lg font-semibold",
						isOperational ? "" : config.textClass,
					)}
					style={isOperational ? { color: accentColor } : undefined}
				>
					{message}
				</span>
			</div>
		</div>
	)
}

function getIncidentStatusConfig(status: IncidentStatus): {
	label: string
	bgClass: string
	textClass: string
} {
	switch (status) {
		case "INVESTIGATING":
			return {
				label: "Investigating",
				bgClass: "bg-red-100 dark:bg-red-900/30",
				textClass: "text-red-700 dark:text-red-400",
			}
		case "IDENTIFIED":
			return {
				label: "Identified",
				bgClass: "bg-orange-100 dark:bg-orange-900/30",
				textClass: "text-orange-700 dark:text-orange-400",
			}
		case "MONITORING":
			return {
				label: "Monitoring",
				bgClass: "bg-blue-100 dark:bg-blue-900/30",
				textClass: "text-blue-700 dark:text-blue-400",
			}
		case "RESOLVED":
			return {
				label: "Resolved",
				bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
				textClass: "text-emerald-700 dark:text-emerald-400",
			}
	}
}

function getSeverityConfig(severity: "MINOR" | "MAJOR" | "CRITICAL"): {
	dotClass: string
} {
	switch (severity) {
		case "MINOR":
			return { dotClass: "bg-amber-500" }
		case "MAJOR":
			return { dotClass: "bg-orange-500" }
		case "CRITICAL":
			return { dotClass: "bg-red-500" }
	}
}

function formatRelativeTime(date: string): string {
	const now = new Date()
	const then = new Date(date)
	const diffMs = now.getTime() - then.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMins / 60)
	const diffDays = Math.floor(diffHours / 24)

	if (diffMins < 1) return "Just now"
	if (diffMins < 60) return `${diffMins}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays < 7) return `${diffDays}d ago`
	return then.toLocaleDateString()
}

function formatDateTime(date: string): string {
	return new Date(date).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

function IncidentCard({ incident }: { incident: PublicIncident }) {
	const statusConfig = getIncidentStatusConfig(incident.status)
	const severityConfig = getSeverityConfig(incident.severity)

	return (
		<div className="rounded-lg border border-border/50 bg-card p-4">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-2">
					<span
						className={cn("h-2 w-2 rounded-full", severityConfig.dotClass)}
					/>
					<h3 className="font-medium">{incident.title}</h3>
				</div>
				<span
					className={cn(
						"shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
						statusConfig.bgClass,
						statusConfig.textClass,
					)}
				>
					{statusConfig.label}
				</span>
			</div>

			{incident.updates.length > 0 && (
				<div className="mt-4 space-y-3 border-l-2 border-muted pl-4">
					{incident.updates.slice(0, 3).map((update) => {
						const updateConfig = getIncidentStatusConfig(update.status)
						return (
							<div key={update.id} className="text-sm">
								<div className="flex items-center gap-2 text-muted-foreground">
									<span className="font-mono text-xs">
										{formatDateTime(update.createdAt)}
									</span>
									<span
										className={cn(
											"rounded px-1.5 py-0.5 text-xs font-medium",
											updateConfig.bgClass,
											updateConfig.textClass,
										)}
									>
										{updateConfig.label}
									</span>
								</div>
								<p className="mt-1 text-foreground">{update.message}</p>
							</div>
						)
					})}
				</div>
			)}

			<div className="mt-3 text-xs text-muted-foreground">
				Started {formatRelativeTime(incident.startsAt)}
				{incident.resolvedAt && (
					<> · Resolved {formatRelativeTime(incident.resolvedAt)}</>
				)}
			</div>
		</div>
	)
}

function MaintenanceCard({ maintenance }: { maintenance: PublicMaintenance }) {
	const isActive = maintenance.status === "IN_PROGRESS"
	const isScheduled = maintenance.status === "SCHEDULED"

	return (
		<div
			className={cn(
				"rounded-lg border p-4",
				isActive
					? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
					: "border-border/50 bg-card",
			)}
		>
			<div className="flex items-start gap-3">
				<span className="mt-0.5 text-lg">🔧</span>
				<div className="flex-1">
					<h3 className="font-medium">{maintenance.title}</h3>
					{maintenance.description && (
						<p className="mt-1 text-sm text-muted-foreground">
							{maintenance.description}
						</p>
					)}
					<div className="mt-2 text-xs text-muted-foreground">
						{isActive ? (
							<span className="font-medium text-blue-600 dark:text-blue-400">
								In progress
							</span>
						) : isScheduled ? (
							<>
								{formatDateTime(maintenance.scheduledFor)} -{" "}
								{formatDateTime(maintenance.expectedEnd)}
							</>
						) : (
							<span className="text-emerald-600 dark:text-emerald-400">
								Completed
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default async function StatusPage({ params }: PageProps) {
	const { slug } = await params
	const statusPage = await getStatusPage(slug)

	if (!statusPage) {
		notFound()
	}

	const themeClass = getThemeClass(statusPage.theme)
	const hasActiveIncidents = statusPage.activeIncidents.length > 0
	const hasUpcomingMaintenances = statusPage.upcomingMaintenances.length > 0
	const hasRecentIncidents = statusPage.recentIncidents.length > 0

	return (
		<div
			className={cn("min-h-screen bg-background text-foreground", themeClass)}
		>
			<div className="mx-auto max-w-2xl px-4 py-12">
				{/* Header */}
				<header className="mb-8 text-center">
					{statusPage.logoUrl && (
						<img
							src={statusPage.logoUrl}
							alt={statusPage.name}
							className="mx-auto mb-4 h-12 w-auto"
						/>
					)}
					<h1 className="text-2xl font-bold">{statusPage.name}</h1>
					{statusPage.description && (
						<p className="mt-2 text-muted-foreground">
							{statusPage.description}
						</p>
					)}
				</header>

				{/* Overall Status */}
				<OverallStatusBanner
					status={statusPage.overallStatus}
					accentColor={statusPage.accentColor}
				/>

				{/* Active Incidents */}
				{hasActiveIncidents && (
					<section className="mt-10">
						<h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
							Active Incidents
						</h2>
						<div className="space-y-3">
							{statusPage.activeIncidents.map((incident) => (
								<IncidentCard key={incident.id} incident={incident} />
							))}
						</div>
					</section>
				)}

				{/* Upcoming Maintenances */}
				{hasUpcomingMaintenances && (
					<section className="mt-10">
						<h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Scheduled Maintenance
						</h2>
						<div className="space-y-3">
							{statusPage.upcomingMaintenances.map((maintenance) => (
								<MaintenanceCard
									key={maintenance.id}
									maintenance={maintenance}
								/>
							))}
						</div>
					</section>
				)}

				{/* Components */}
				{statusPage.components.length > 0 && (
					<section className="mt-10">
						<h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Services
						</h2>
						<div className="space-y-3">
							{statusPage.components.map((component) => (
								<ComponentCard
									key={component.id}
									displayName={component.displayName}
									status={component.status}
									uptimeHistory={component.uptimeHistory}
									accentColor={statusPage.accentColor}
								/>
							))}
						</div>
					</section>
				)}

				{/* No components message */}
				{statusPage.components.length === 0 && (
					<p className="mt-10 text-center text-muted-foreground">
						No services configured for this status page.
					</p>
				)}

				{/* Recent Incidents */}
				{hasRecentIncidents && (
					<section className="mt-10">
						<h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Past Incidents
						</h2>
						<div className="space-y-3">
							{statusPage.recentIncidents.map((incident) => (
								<IncidentCard key={incident.id} incident={incident} />
							))}
						</div>
					</section>
				)}

				{/* No incidents message */}
				{!hasActiveIncidents && !hasRecentIncidents && (
					<p className="mt-10 text-center text-sm text-muted-foreground">
						No incidents in the past 7 days ✓
					</p>
				)}

				{/* Footer */}
				<footer className="mt-16 text-center">
					<Link
						href="https://haspulse.dev"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-muted-foreground/60 transition-colors hover:text-muted-foreground"
					>
						Powered by HasPulse
					</Link>
				</footer>
			</div>
		</div>
	)
}
