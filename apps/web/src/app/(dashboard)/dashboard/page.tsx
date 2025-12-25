"use client"

import { StatusBadge, statusColors } from "@/components/checks/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardCheck } from "@/lib/api"
import { useDashboardChecks, useDashboardStats } from "@/lib/query"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

function CheckRow({ check }: { check: DashboardCheck }) {
	const isOverdue = check.status === "LATE" || check.status === "DOWN"

	return (
		<tr>
			<td className="py-3 font-medium text-foreground">
				<Link
					href={`/projects/${check.projectId}`}
					className="hover:text-primary transition-colors"
				>
					{check.name}
				</Link>
				<span className="text-xs text-muted-foreground ml-2">
					{check.projectName}
				</span>
			</td>
			<td className="py-3">
				<StatusBadge status={check.status} />
			</td>
			<td className="py-3 font-mono text-xs text-muted-foreground">
				{check.scheduleType === "CRON"
					? check.scheduleValue
					: `Every ${check.scheduleValue}s`}
			</td>
			<td
				className={`py-3 ${isOverdue ? statusColors[check.status] : "text-muted-foreground"}`}
			>
				{check.lastPingAt
					? formatDistanceToNow(new Date(check.lastPingAt), { addSuffix: true })
					: "Never"}
			</td>
		</tr>
	)
}

export default function DashboardPage() {
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
						<table className="w-full text-sm text-left">
							<thead>
								<tr className="text-xs text-muted-foreground uppercase tracking-wide">
									<th className="py-2 font-medium">Check</th>
									<th className="py-2 font-medium">Status</th>
									<th className="py-2 font-medium font-mono">Schedule</th>
									<th className="py-2 font-medium">Last ping</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{checksData.checks.map((check) => (
									<CheckRow key={check.id} check={check} />
								))}
							</tbody>
						</table>
					) : (
						<div className="text-center py-12 text-muted-foreground">
							<p className="mb-4">No checks yet.</p>
							<Link
								href="/projects"
								className="text-primary hover:underline font-medium"
							>
								Create a project to add checks
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
