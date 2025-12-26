"use client"

import { PingSparkline } from "@/components/checks/ping-sparkline"
import { StatusBadge, statusColors } from "@/components/checks/status-badge"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardCheck } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import { useDashboardChecks, useDashboardStats } from "@/lib/query"
import { cn } from "@/lib/utils"
import { ChevronRight, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

function getRowClassName(status: DashboardCheck["status"]): string {
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

function CheckRow({ check }: { check: DashboardCheck }) {
	const isOverdue = check.status === "LATE" || check.status === "DOWN"

	return (
		<tr
			className={cn(
				"cursor-pointer transition-colors",
				getRowClassName(check.status),
			)}
		>
			<td className="py-3 px-4">
				<Link href={`/checks/${check.id}`} className="block">
					<p className="font-medium text-foreground">{check.name}</p>
					<p className="text-xs text-muted-foreground">{check.projectName}</p>
				</Link>
			</td>
			<td className="py-3 px-4">
				<StatusBadge status={check.status} />
			</td>
			<td className="py-3 px-4 font-mono text-xs text-muted-foreground">
				{check.scheduleType === "CRON"
					? check.scheduleValue
					: `${check.scheduleValue}s`}
			</td>
			<td
				className={cn(
					"py-3 px-4",
					isOverdue ? statusColors[check.status] : "text-muted-foreground",
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
}

export default function DashboardPage() {
	const router = useRouter()
	const { data: stats, isLoading: statsLoading } = useDashboardStats()
	const { data: checksData, isLoading: checksLoading } = useDashboardChecks()

	const isLoading = statsLoading || checksLoading

	if (isLoading) {
		return (
			<div className="p-6">
				<h1 className="font-display text-2xl font-semibold mb-6">Dashboard</h1>
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<div className="p-6">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} className="h-20 rounded-lg" />
							))}
						</div>
						<Skeleton className="h-48" />
					</div>
				</div>
			</div>
		)
	}

	const upCount = stats?.checksByStatus.UP ?? 0
	const totalActive =
		upCount +
		(stats?.checksByStatus.DOWN ?? 0) +
		(stats?.checksByStatus.LATE ?? 0) +
		(stats?.checksByStatus.NEW ?? 0)
	const uptimePercent = totalActive > 0 ? (upCount / totalActive) * 100 : 100
	const incidents =
		(stats?.checksByStatus.DOWN ?? 0) + (stats?.checksByStatus.LATE ?? 0)

	return (
		<div className="p-6">
			<h1 className="font-display text-2xl font-semibold mb-6">Dashboard</h1>

			<div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/20">
				<div className="px-4 py-3 border-b border-border flex items-center gap-2">
					<div className="w-3 h-3 rounded-full bg-muted" />
					<div className="w-3 h-3 rounded-full bg-muted" />
					<div className="w-3 h-3 rounded-full bg-muted" />
				</div>
				<div className="p-6">
					{/* Stats Grid */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						<div className="bg-secondary/50 rounded-lg p-4 text-left">
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Uptime
							</div>
							<div className="text-2xl font-semibold text-primary">
								{uptimePercent.toFixed(1)}%
							</div>
						</div>
						<div className="bg-secondary/50 rounded-lg p-4 text-left">
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Projects
							</div>
							<div className="text-2xl font-semibold text-foreground">
								{stats?.totalProjects ?? 0}
							</div>
						</div>
						<div className="bg-secondary/50 rounded-lg p-4 text-left">
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Incidents
							</div>
							<div
								className={`text-2xl font-semibold ${incidents > 0 ? "text-warning" : "text-foreground"}`}
							>
								{incidents}
							</div>
						</div>
						<div className="bg-secondary/50 rounded-lg p-4 text-left">
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Checks
							</div>
							<div className="text-2xl font-semibold text-foreground">
								{stats?.totalChecks ?? 0}
							</div>
						</div>
					</div>

					{/* Checks Table */}
					{checksData?.checks && checksData.checks.length > 0 ? (
						<div className="bg-card border border-border rounded-xl overflow-hidden">
							<table className="w-full text-sm text-left">
								<thead>
									<tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
										<th className="py-3 px-4 font-medium">Check</th>
										<th className="py-3 px-4 font-medium">Status</th>
										<th className="py-3 px-4 font-medium font-mono">
											Schedule
										</th>
										<th className="py-3 px-4 font-medium">Last ping</th>
										<th className="py-3 px-4 font-medium">Recent</th>
										<th className="py-3 px-4 w-10" />
									</tr>
								</thead>
								<tbody className="divide-y divide-border/50">
									{checksData.checks.map((check) => (
										<CheckRow key={check.id} check={check} />
									))}
								</tbody>
							</table>
						</div>
					) : (
						<EmptyState
							icon={Zap}
							title="Welcome to HasPulse"
							description="Monitor your cron jobs, scheduled tasks, and background workers. Create a project to get started."
							action={{
								label: "Create project",
								onClick: () => router.push("/projects"),
							}}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
