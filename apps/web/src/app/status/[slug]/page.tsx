import { StatusBadge } from "@/components/checks/status-badge"
import { type DayStatus, UptimeBar } from "@/components/checks/uptime-bar"
import type { Check, Project } from "@/lib/api"
import { format, formatDistanceToNow } from "date-fns"
import { AlertTriangle, CheckCircle, Clock, Search, Wrench } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

type IncidentStatus = "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED"
type IncidentImpact = "NONE" | "MINOR" | "MAJOR" | "CRITICAL"

type IncidentUpdate = {
	id: string
	status: IncidentStatus
	message: string
	createdAt: string
}

type Incident = {
	id: string
	title: string
	status: IncidentStatus
	impact: IncidentImpact
	createdAt: string
	resolvedAt: string | null
	updates: IncidentUpdate[]
}

type Maintenance = {
	id: string
	title: string
	description: string | null
	startsAt: string
	endsAt: string
}

type StatusPageData = {
	project: Pick<
		Project,
		"name" | "slug" | "statusPageTitle" | "statusPageLogoUrl"
	>
	checks: Array<
		Pick<Check, "id" | "name" | "status" | "lastPingAt"> & {
			uptimeDays: DayStatus[]
		}
	>
	activeIncidents: Incident[]
	activeMaintenance: Maintenance[]
	upcomingMaintenance: Maintenance[]
}

async function getStatusPageData(slug: string): Promise<StatusPageData | null> {
	try {
		const res = await fetch(`${API_URL}/status/${slug}`, {
			next: { revalidate: 60 },
		})

		if (!res.ok) {
			if (res.status === 404) return null
			throw new Error("Failed to fetch status")
		}

		return res.json()
	} catch {
		return null
	}
}

function getOverallStatus(
	checks: StatusPageData["checks"],
	activeIncidents: Incident[],
): {
	status: "operational" | "degraded" | "outage"
	label: string
	color: string
} {
	const hasCriticalIncident = activeIncidents.some(
		(i) => i.impact === "CRITICAL",
	)
	const hasMajorIncident = activeIncidents.some((i) => i.impact === "MAJOR")

	if (hasCriticalIncident) {
		return {
			status: "outage",
			label: "Major Outage",
			color: "bg-destructive",
		}
	}

	const hasDown = checks.some((c) => c.status === "DOWN" || c.status === "LATE")
	const allDown = checks.every(
		(c) => c.status === "DOWN" || c.status === "LATE",
	)

	if (allDown && checks.length > 0) {
		return {
			status: "outage",
			label: "Major Outage",
			color: "bg-destructive",
		}
	}

	if (hasDown || hasMajorIncident || activeIncidents.length > 0) {
		return {
			status: "degraded",
			label: "Partial Outage",
			color: "bg-warning",
		}
	}

	return {
		status: "operational",
		label: "All Systems Operational",
		color: "bg-success",
	}
}

function getImpactColor(impact: IncidentImpact): string {
	switch (impact) {
		case "CRITICAL":
			return "bg-destructive text-white"
		case "MAJOR":
			return "bg-orange-500 text-white"
		case "MINOR":
			return "bg-warning text-warning-foreground"
		default:
			return "bg-muted text-muted-foreground"
	}
}

function getStatusIcon(status: IncidentStatus) {
	switch (status) {
		case "INVESTIGATING":
			return <Search className="h-4 w-4" />
		case "IDENTIFIED":
			return <AlertTriangle className="h-4 w-4" />
		case "MONITORING":
			return <Clock className="h-4 w-4" />
		case "RESOLVED":
			return <CheckCircle className="h-4 w-4" />
	}
}

function getStatusLabel(status: IncidentStatus): string {
	switch (status) {
		case "INVESTIGATING":
			return "Investigating"
		case "IDENTIFIED":
			return "Identified"
		case "MONITORING":
			return "Monitoring"
		case "RESOLVED":
			return "Resolved"
	}
}

function IncidentCard({ incident }: { incident: Incident }) {
	const impactColor = getImpactColor(incident.impact)
	const sortedUpdates = [...incident.updates].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	)

	return (
		<div className="border rounded-lg overflow-hidden bg-card">
			<div className={`px-4 py-3 ${impactColor}`}>
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">{incident.title}</h3>
					<span className="text-xs px-2 py-1 rounded bg-white/20">
						{incident.impact}
					</span>
				</div>
			</div>
			<div className="p-4">
				<div className="space-y-4">
					{sortedUpdates.map((update, index) => (
						<div key={update.id} className="flex gap-3">
							<div className="flex flex-col items-center">
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
									{getStatusIcon(update.status)}
								</div>
								{index < sortedUpdates.length - 1 && (
									<div className="w-px flex-1 bg-border mt-2" />
								)}
							</div>
							<div className="flex-1 pb-4">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium text-sm">
										{getStatusLabel(update.status)}
									</span>
									<span className="text-xs text-muted-foreground">
										{formatDistanceToNow(new Date(update.createdAt), {
											addSuffix: true,
										})}
									</span>
								</div>
								<p className="text-sm text-muted-foreground">
									{update.message}
								</p>
							</div>
						</div>
					))}
				</div>
				<div className="text-xs text-muted-foreground pt-2 border-t">
					Started{" "}
					{format(new Date(incident.createdAt), "MMM d, yyyy 'at' h:mm a")}
				</div>
			</div>
		</div>
	)
}

function MaintenanceBanner({ maintenance }: { maintenance: Maintenance }) {
	const endsAt = new Date(maintenance.endsAt)
	const now = new Date()
	const remaining = formatDistanceToNow(endsAt)

	return (
		<div className="bg-blue-500 text-white rounded-lg p-4 mb-6">
			<div className="flex items-start gap-3">
				<Wrench className="h-5 w-5 mt-0.5 flex-shrink-0" />
				<div>
					<p className="font-semibold">Scheduled Maintenance in Progress</p>
					<p className="text-sm text-blue-100">{maintenance.title}</p>
					{maintenance.description && (
						<p className="text-sm text-blue-100 mt-1">
							{maintenance.description}
						</p>
					)}
					<p className="text-xs text-blue-200 mt-2">
						Expected to end in {remaining}
					</p>
				</div>
			</div>
		</div>
	)
}

function UpcomingMaintenanceSection({
	maintenance,
}: { maintenance: Maintenance[] }) {
	if (maintenance.length === 0) return null

	return (
		<div className="mt-8">
			<h2 className="text-lg font-semibold mb-4">Scheduled Maintenance</h2>
			<div className="space-y-3">
				{maintenance.map((m) => (
					<div key={m.id} className="border rounded-lg p-4 bg-card">
						<div className="flex items-start gap-3">
							<Wrench className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
							<div className="flex-1">
								<p className="font-medium">{m.title}</p>
								{m.description && (
									<p className="text-sm text-muted-foreground mt-1">
										{m.description}
									</p>
								)}
								<p className="text-sm text-muted-foreground mt-2">
									{format(new Date(m.startsAt), "MMM d, yyyy 'at' h:mm a")} -{" "}
									{format(new Date(m.endsAt), "h:mm a")}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default async function StatusPage({
	params,
}: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const data = await getStatusPageData(slug)

	if (!data) {
		notFound()
	}

	const overall = getOverallStatus(data.checks, data.activeIncidents)
	const hasActiveIncidents = data.activeIncidents.length > 0
	const hasActiveMaintenance = data.activeMaintenance.length > 0

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-3xl mx-auto px-4 py-12">
				<div className="text-center mb-8">
					{data.project.statusPageLogoUrl && (
						<Image
							src={data.project.statusPageLogoUrl}
							alt={data.project.name}
							width={48}
							height={48}
							className="h-12 w-auto mx-auto mb-4"
							unoptimized
						/>
					)}
					<h1 className="font-display text-3xl font-bold mb-4">
						{data.project.statusPageTitle ?? `${data.project.name} Status`}
					</h1>
					<div
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white ${overall.color}`}
					>
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
						</span>
						<span className="font-medium">{overall.label}</span>
					</div>
				</div>

				{hasActiveMaintenance && (
					<MaintenanceBanner maintenance={data.activeMaintenance[0]} />
				)}

				{hasActiveIncidents && (
					<div className="mb-8 space-y-4">
						<h2 className="text-lg font-semibold">Active Incidents</h2>
						{data.activeIncidents.map((incident) => (
							<IncidentCard key={incident.id} incident={incident} />
						))}
					</div>
				)}

				<div className="space-y-6">
					{data.checks.length === 0 ? (
						<p className="text-center text-muted-foreground">
							No monitors configured.
						</p>
					) : (
						data.checks.map((check) => (
							<div key={check.id} className="border rounded-lg p-4 bg-card">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-3">
										<StatusBadge status={check.status} />
										<span className="font-medium">{check.name}</span>
									</div>
									<span className="text-sm text-muted-foreground">
										{check.lastPingAt
											? `Last ping ${formatDistanceToNow(new Date(check.lastPingAt), { addSuffix: true })}`
											: "No pings yet"}
									</span>
								</div>
								<UptimeBar days={check.uptimeDays} />
								<div className="flex justify-between text-xs text-muted-foreground mt-2">
									<span>90 days ago</span>
									<span>Today</span>
								</div>
							</div>
						))
					)}
				</div>

				<UpcomingMaintenanceSection maintenance={data.upcomingMaintenance} />

				<footer className="mt-12 text-center text-sm text-muted-foreground">
					Powered by{" "}
					<a
						href="https://haspulse.dev"
						className="font-medium text-foreground hover:underline"
					>
						Haspulse
					</a>
				</footer>
			</div>
		</div>
	)
}
