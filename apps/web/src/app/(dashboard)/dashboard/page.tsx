"use client"

import { PingSparkline } from "@/components/checks/ping-sparkline"
import { StatusBadge, statusColors } from "@/components/checks/status-badge"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { DashboardCheck } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import { useDashboardChecks, useDashboardStats } from "@/lib/query"
import { cn } from "@/lib/utils"
import cronstrue from "cronstrue"
import { ChevronRight, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

function formatSchedule(scheduleType: string, scheduleValue: string): string {
	if (scheduleType === "CRON") {
		try {
			return cronstrue.toString(scheduleValue, { verbose: false })
		} catch {
			return scheduleValue
		}
	}
	const seconds = Number.parseInt(scheduleValue, 10)
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
	return `${Math.floor(seconds / 86400)}d`
}

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
		<TableRow className={cn("cursor-pointer", getRowClassName(check.status))}>
			<TableCell className="py-3">
				<Link href={`/checks/${check.id}`} className="block">
					<p className="font-medium text-foreground">{check.name}</p>
					<p className="text-xs text-muted-foreground">{check.projectName}</p>
				</Link>
			</TableCell>
			<TableCell className="py-3">
				<StatusBadge status={check.status} />
			</TableCell>
			<TableCell className="py-3 text-xs text-muted-foreground">
				{formatSchedule(check.scheduleType, check.scheduleValue)}
			</TableCell>
			<TableCell
				className={cn(
					"py-3",
					isOverdue ? statusColors[check.status] : "text-muted-foreground",
				)}
			>
				{check.lastPingAt
					? formatRelativeCompactAgo(check.lastPingAt)
					: "Never"}
			</TableCell>
			<TableCell className="py-3">
				<PingSparkline sparkline={check.sparkline} />
			</TableCell>
			<TableCell className="py-3 w-10">
				<Link href={`/checks/${check.id}`}>
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				</Link>
			</TableCell>
		</TableRow>
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
				<PageHeader title="Dashboard" />
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
			<PageHeader title="Dashboard" />

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
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="text-xs uppercase tracking-wide">
											Check
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wide">
											Status
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wide">
											Schedule
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wide">
											Last ping
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wide">
											Recent
										</TableHead>
										<TableHead className="w-10" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{checksData.checks.map((check) => (
										<CheckRow key={check.id} check={check} />
									))}
								</TableBody>
							</Table>
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
