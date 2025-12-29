"use client"

import { PingSparkline } from "@/components/cron-jobs/ping-sparkline"
import { StatusBadge, statusColors } from "@/components/cron-jobs/status-badge"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ProjectForm } from "@/components/projects/project-form"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import type { DashboardCronJob } from "@/lib/api"
import { isLimitExceeded } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import {
	useBilling,
	useCreateProject,
	useDashboardCronJobs,
	useDashboardStats,
} from "@/lib/query"
import { cn } from "@/lib/utils"
import cronstrue from "cronstrue"
import { ChevronRight, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

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

function getRowClassName(status: DashboardCronJob["status"]): string {
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

function CronJobRow({ cronJob }: { cronJob: DashboardCronJob }) {
	const isOverdue = cronJob.status === "LATE" || cronJob.status === "DOWN"

	return (
		<TableRow className={cn("cursor-pointer", getRowClassName(cronJob.status))}>
			<TableCell className="py-3">
				<Link href={`/cron-jobs/${cronJob.id}`} className="block">
					<p className="font-medium text-foreground">{cronJob.name}</p>
					<p className="text-xs text-muted-foreground">{cronJob.projectName}</p>
				</Link>
			</TableCell>
			<TableCell className="py-3">
				<StatusBadge status={cronJob.status} />
			</TableCell>
			<TableCell className="py-3 text-xs text-muted-foreground">
				{formatSchedule(cronJob.scheduleType, cronJob.scheduleValue)}
			</TableCell>
			<TableCell
				className={cn(
					"py-3",
					isOverdue ? statusColors[cronJob.status] : "text-muted-foreground",
				)}
			>
				{cronJob.lastPingAt
					? formatRelativeCompactAgo(cronJob.lastPingAt)
					: "Never"}
			</TableCell>
			<TableCell className="py-3">
				<PingSparkline sparkline={cronJob.sparkline} />
			</TableCell>
			<TableCell className="py-3 w-10">
				<Link href={`/cron-jobs/${cronJob.id}`}>
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				</Link>
			</TableCell>
		</TableRow>
	)
}

export default function DashboardPage() {
	const router = useRouter()
	const { data: stats, isLoading: statsLoading } = useDashboardStats()
	const { data: cronJobsData, isLoading: cronJobsLoading } =
		useDashboardCronJobs()
	const { data: billing } = useBilling()
	const createProject = useCreateProject()
	const [showForm, setShowForm] = useState(false)
	const [showUpgrade, setShowUpgrade] = useState(false)

	const projectLimit = billing?.usage.projects.limit ?? 2

	function handleCreate(formData: { name: string; slug: string }) {
		createProject.mutate(formData, {
			onSuccess: (project) => {
				setShowForm(false)
				toast.success("Project created")
				router.push(`/projects/${project.id}`)
			},
			onError: (error) => {
				if (isLimitExceeded(error)) {
					setShowForm(false)
					setShowUpgrade(true)
				} else {
					toast.error(error.message)
				}
			},
		})
	}

	const isLoading = statsLoading || cronJobsLoading

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

	const issues =
		(stats?.cronJobsByStatus.DOWN ?? 0) + (stats?.cronJobsByStatus.LATE ?? 0)

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
								{stats?.uptimePercent.toFixed(1)}%
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
								Issues
							</div>
							<div
								className={`text-2xl font-semibold ${issues > 0 ? "text-warning" : "text-foreground"}`}
							>
								{issues}
							</div>
						</div>
						<div className="bg-secondary/50 rounded-lg p-4 text-left">
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Cron Jobs
							</div>
							<div className="text-2xl font-semibold text-foreground">
								{stats?.totalCronJobs ?? 0}
							</div>
						</div>
					</div>

					{/* Cron Jobs Table */}
					{cronJobsData?.cronJobs && cronJobsData.cronJobs.length > 0 ? (
						<div className="bg-card border border-border rounded-xl overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="text-xs uppercase tracking-wide">
											Cron Job
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
									{cronJobsData.cronJobs.map((cronJob) => (
										<CronJobRow key={cronJob.id} cronJob={cronJob} />
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
								onClick: () => setShowForm(true),
							}}
						/>
					)}
				</div>
			</div>

			<ProjectForm
				open={showForm}
				onOpenChange={setShowForm}
				onSubmit={handleCreate}
				isLoading={createProject.isPending}
			/>

			<UpgradeDialog
				open={showUpgrade}
				onOpenChange={setShowUpgrade}
				resource="projects"
				limit={projectLimit}
			/>
		</div>
	)
}
