"use client"

import { CronJobAlertsTab } from "@/components/cron-jobs/cron-job-alerts-tab"
import { CronJobForm } from "@/components/cron-jobs/cron-job-form"
import { PingSparkline } from "@/components/cron-jobs/ping-sparkline"
import { StatusBadge } from "@/components/cron-jobs/status-badge"
import { PaginationControls } from "@/components/pagination-controls"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PingType, UpdateCronJobData } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import {
	useChannels,
	useCronJob,
	useCronJobAlerts,
	useDeleteCronJob,
	useDurationStats,
	usePauseCronJob,
	usePings,
	useResumeCronJob,
	useUpdateCronJob,
} from "@/lib/query"
import { cn } from "@/lib/utils"
import cronstrue from "cronstrue"
import { formatDistanceToNow } from "date-fns"
import {
	AlertTriangle,
	ArrowLeft,
	Bell,
	Check,
	Clock,
	Copy,
	Loader2,
	Minus,
	MoreHorizontal,
	Pause,
	Pencil,
	Play,
	Timer,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useMemo, useState } from "react"
import { toast } from "sonner"

const pingTypeStyles: Record<PingType, { bg: string; text: string }> = {
	SUCCESS: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
	START: { bg: "bg-blue-500/10", text: "text-blue-500" },
	FAIL: { bg: "bg-red-500/10", text: "text-red-500" },
}

const pingTypeLabels: Record<PingType, string> = {
	SUCCESS: "Success",
	START: "Start",
	FAIL: "Fail",
}

function formatSchedule(scheduleType: string, scheduleValue: string): string {
	if (scheduleType === "CRON") {
		try {
			return cronstrue.toString(scheduleValue, { verbose: false })
		} catch {
			return scheduleValue
		}
	}
	const seconds = Number.parseInt(scheduleValue, 10)
	if (seconds < 60) return `Every ${seconds} seconds`
	if (seconds < 3600) return `Every ${Math.floor(seconds / 60)} minutes`
	if (seconds < 86400) {
		const hours = Math.floor(seconds / 3600)
		return `Every ${hours} hour${hours > 1 ? "s" : ""}`
	}
	const days = Math.floor(seconds / 86400)
	return `Every ${days} day${days > 1 ? "s" : ""}`
}

function formatGrace(seconds: number): string {
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	return `${Math.floor(seconds / 3600)}h`
}

function formatDurationMs(ms: number | null): string {
	if (ms === null) return "—"
	if (ms < 1000) return `${Math.round(ms)}ms`
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
	if (ms < 3600000)
		return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
	const hours = Math.floor(ms / 3600000)
	const mins = Math.floor((ms % 3600000) / 60000)
	return `${hours}h ${mins}m`
}

function StatCell({ label, value }: { label: string; value: string }) {
	return (
		<div className="p-4">
			<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
				{label}
			</div>
			<div className="font-medium text-foreground">{value}</div>
		</div>
	)
}

const trendConfig = {
	increasing: {
		icon: TrendingUp,
		label: "Increasing",
		className: "text-amber-500",
	},
	decreasing: {
		icon: TrendingDown,
		label: "Decreasing",
		className: "text-emerald-500",
	},
	stable: { icon: Minus, label: "Stable", className: "text-muted-foreground" },
	unknown: { icon: null, label: "—", className: "text-muted-foreground" },
} as const

export default function CronJobDetailPage({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = use(params)
	const router = useRouter()
	const [showEdit, setShowEdit] = useState(false)
	const [showDelete, setShowDelete] = useState(false)
	const [copied, setCopied] = useState(false)
	const [pingsPage, setPingsPage] = useState(1)

	const { data: cronJob, isLoading } = useCronJob(id)
	const { data: pingsData, isLoading: pingsLoading } = usePings(id, {
		page: pingsPage,
		limit: 20,
	})
	const { data: channelsData } = useChannels(cronJob?.projectId ?? "")
	const { data: durationStats, isLoading: durationLoading } =
		useDurationStats(id)
	const { data: alertsData } = useCronJobAlerts(id, { page: 1, limit: 1 })

	const updateCronJob = useUpdateCronJob()
	const pauseCronJob = usePauseCronJob()
	const resumeCronJob = useResumeCronJob()
	const deleteCronJob = useDeleteCronJob()

	const hasAnyBody = useMemo(() => {
		return pingsData?.pings.some((p) => p.body) ?? false
	}, [pingsData?.pings])

	function handleUpdate(data: UpdateCronJobData & { channelIds?: string[] }) {
		if (!cronJob) return
		updateCronJob.mutate(
			{ id: cronJob.id, data },
			{
				onSuccess: () => {
					setShowEdit(false)
					toast.success("Cron job updated")
				},
				onError: (error) => {
					toast.error(error.message)
				},
			},
		)
	}

	function handlePause() {
		if (!cronJob) return
		pauseCronJob.mutate(cronJob.id, {
			onSuccess: () => toast.success("Cron job paused"),
			onError: (error) => toast.error(error.message),
		})
	}

	function handleResume() {
		if (!cronJob) return
		resumeCronJob.mutate(cronJob.id, {
			onSuccess: () => toast.success("Cron job resumed"),
			onError: (error) => toast.error(error.message),
		})
	}

	function handleDelete() {
		if (!cronJob) return
		deleteCronJob.mutate(
			{ id: cronJob.id, projectId: cronJob.projectId },
			{
				onSuccess: () => {
					toast.success("Cron job deleted")
					router.push(`/projects/${cronJob.projectId}`)
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	function handleCopyUrl() {
		if (!cronJob?.slug) return
		const url = `${window.location.origin}/ping/${cronJob.slug}`
		navigator.clipboard.writeText(url)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
		toast.success("Ping URL copied")
	}

	if (isLoading) {
		return (
			<div className="p-6">
				<Skeleton className="h-8 w-48 mb-4" />
				<Skeleton className="h-64" />
			</div>
		)
	}

	if (!cronJob) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">Cron job not found</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard">Back to dashboard</Link>
				</Button>
			</div>
		)
	}

	const isPaused = cronJob.status === "PAUSED"
	const isActioning =
		pauseCronJob.isPending || resumeCronJob.isPending || deleteCronJob.isPending

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4 mb-6">
				<div className="flex items-start gap-3">
					<Button variant="ghost" size="icon" className="mt-1" asChild>
						<Link href={`/projects/${cronJob.projectId}`}>
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-display text-2xl font-semibold">
								{cronJob.name}
							</h1>
							<StatusBadge status={cronJob.status} />
						</div>
						{cronJob.slug && (
							<button
								type="button"
								onClick={handleCopyUrl}
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mt-0.5 group"
							>
								<span className="font-mono text-sm">/{cronJob.slug}</span>
								{copied ? (
									<Check className="h-3 w-3 text-emerald-500" />
								) : (
									<Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
								)}
							</button>
						)}
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setShowEdit(true)}>
							<Pencil className="h-4 w-4" />
							Edit
						</DropdownMenuItem>
						{isPaused ? (
							<DropdownMenuItem onClick={handleResume} disabled={isActioning}>
								<Play className="h-4 w-4" />
								Resume
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem onClick={handlePause} disabled={isActioning}>
								<Pause className="h-4 w-4" />
								Pause
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setShowDelete(true)}
							disabled={isActioning}
						>
							<Trash2 className="h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="mb-6">
					<TabsTrigger value="overview">
						<Clock className="h-4 w-4" />
						Overview
					</TabsTrigger>
					<TabsTrigger value="alerts" className="gap-2">
						<Bell className="h-4 w-4" />
						Alerts
						{alertsData && alertsData.total > 0 && (
							<Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
								{alertsData.total}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					{/* Stats Panel */}
					<div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl shadow-black/10 mb-6">
						<div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
							<div className="p-4">
								<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
									Schedule
								</div>
								<div className="font-medium text-foreground">
									{formatSchedule(cronJob.scheduleType, cronJob.scheduleValue)}
								</div>
								{cronJob.scheduleType === "CRON" && (
									<div className="font-mono text-xs text-muted-foreground mt-0.5">
										{cronJob.scheduleValue}
									</div>
								)}
							</div>
							<div className="p-4">
								<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
									Grace Period
								</div>
								<div className="font-medium text-foreground">
									{formatGrace(cronJob.graceSeconds)}
								</div>
							</div>
							<div className="p-4">
								<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
									Last Ping
								</div>
								<div className="font-medium text-foreground">
									{cronJob.lastPingAt
										? formatRelativeCompactAgo(cronJob.lastPingAt)
										: "Never"}
								</div>
							</div>
							<div className="p-4">
								<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
									Recent Activity
								</div>
								<PingSparkline sparkline={cronJob.sparkline} />
							</div>
						</div>
					</div>

					{/* Duration Stats */}
					<div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl shadow-black/10 mb-6">
						<div className="px-4 py-3 border-b border-border flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Timer className="h-4 w-4 text-muted-foreground" />
								<h2 className="font-medium">Duration Stats</h2>
							</div>
							{durationStats?.isAnomaly && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Badge variant="destructive" className="gap-1 cursor-help">
											<AlertTriangle className="h-3 w-3" />
											Anomaly
										</Badge>
									</TooltipTrigger>
									<TooltipContent side="left" className="max-w-[250px]">
										Duration significantly deviates from the 7-day baseline
										(z-score exceeded threshold)
									</TooltipContent>
								</Tooltip>
							)}
						</div>
						{durationLoading ? (
							<div className="p-4 grid grid-cols-3 md:grid-cols-6 gap-4">
								{["avg", "p50", "p95", "p99", "samples", "trend"].map(
									(label) => (
										<div key={label}>
											<Skeleton className="h-3 w-16 mb-2" />
											<Skeleton className="h-5 w-12" />
										</div>
									),
								)}
							</div>
						) : durationStats?.current ? (
							<>
								<div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-border">
									<StatCell
										label="Avg"
										value={formatDurationMs(durationStats.current.avgMs)}
									/>
									<StatCell
										label="P50"
										value={formatDurationMs(durationStats.current.p50Ms)}
									/>
									<StatCell
										label="P95"
										value={formatDurationMs(durationStats.current.p95Ms)}
									/>
									<StatCell
										label="P99"
										value={formatDurationMs(durationStats.current.p99Ms)}
									/>
									<StatCell
										label="Samples"
										value={String(durationStats.current.sampleCount)}
									/>
									<div className="p-4">
										<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
											Trend
										</div>
										{(() => {
											const config = trendConfig[durationStats.trend.direction]
											const Icon = config.icon
											return (
												<div
													className={cn(
														"flex items-center gap-1.5 font-medium",
														config.className,
													)}
												>
													{Icon && <Icon className="h-4 w-4" />}
													<span>{config.label}</span>
												</div>
											)
										})()}
									</div>
								</div>
								{durationStats.trend.last5.length > 0 && (
									<div className="px-4 py-3 border-t border-border bg-muted/30">
										<div className="text-xs text-muted-foreground mb-1.5">
											Last 5 durations
										</div>
										<div className="flex items-center gap-2 font-mono text-sm">
											{durationStats.trend.last5.map((ms, i) => (
												<span
													// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size array from API
													key={i}
													className={cn(
														"px-1.5 py-0.5 rounded text-xs",
														i === durationStats.trend.last5.length - 1
															? "bg-primary/10 text-primary font-medium"
															: "text-muted-foreground",
													)}
												>
													{formatDurationMs(ms)}
												</span>
											))}
										</div>
									</div>
								)}
							</>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p className="text-sm">No duration data yet</p>
								<p className="text-xs mt-1">
									Send{" "}
									<code className="bg-secondary px-1 py-0.5 rounded">
										START
									</code>{" "}
									then{" "}
									<code className="bg-secondary px-1 py-0.5 rounded">
										SUCCESS
									</code>{" "}
									pings to track duration
								</p>
							</div>
						)}
					</div>

					{/* Ping History */}
					<div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl shadow-black/10">
						<div className="px-4 py-3 border-b border-border">
							<h2 className="font-medium">Ping History</h2>
						</div>
						{pingsLoading ? (
							<div className="p-4 space-y-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : pingsData?.pings.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No pings recorded yet</p>
								<p className="text-xs mt-1">
									Send a request to{" "}
									<code className="bg-secondary px-1.5 py-0.5 rounded">
										/ping/{cronJob.slug}
									</code>
								</p>
							</div>
						) : (
							<>
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="text-xs uppercase tracking-wide">
												Type
											</TableHead>
											<TableHead className="text-xs uppercase tracking-wide">
												Time
											</TableHead>
											<TableHead className="text-xs uppercase tracking-wide">
												Source IP
											</TableHead>
											{hasAnyBody && (
												<TableHead className="text-xs uppercase tracking-wide">
													Body
												</TableHead>
											)}
										</TableRow>
									</TableHeader>
									<TableBody>
										{pingsData?.pings.map((ping) => (
											<TableRow key={ping.id}>
												<TableCell className="py-3">
													<span
														className={cn(
															"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
															pingTypeStyles[ping.type].bg,
															pingTypeStyles[ping.type].text,
														)}
													>
														{pingTypeLabels[ping.type]}
													</span>
												</TableCell>
												<TableCell className="py-3 text-muted-foreground">
													<Tooltip>
														<TooltipTrigger>
															{formatDistanceToNow(new Date(ping.createdAt), {
																addSuffix: true,
															})}
														</TooltipTrigger>
														<TooltipContent>
															{new Date(ping.createdAt).toLocaleString()}
														</TooltipContent>
													</Tooltip>
												</TableCell>
												<TableCell className="py-3 font-mono text-xs text-muted-foreground">
													{ping.sourceIp}
												</TableCell>
												{hasAnyBody && (
													<TableCell className="py-3 text-muted-foreground truncate max-w-[200px]">
														{ping.body ? (
															<Tooltip>
																<TooltipTrigger className="truncate block max-w-[200px]">
																	{ping.body}
																</TooltipTrigger>
																<TooltipContent className="max-w-sm">
																	<pre className="text-xs whitespace-pre-wrap">
																		{ping.body}
																	</pre>
																</TooltipContent>
															</Tooltip>
														) : (
															<span className="text-muted-foreground/50">
																—
															</span>
														)}
													</TableCell>
												)}
											</TableRow>
										))}
									</TableBody>
								</Table>
								{pingsData && pingsData.totalPages > 1 && (
									<div className="p-4 border-t border-border">
										<PaginationControls
											page={pingsPage}
											totalPages={pingsData.totalPages}
											onPageChange={setPingsPage}
										/>
									</div>
								)}
							</>
						)}
					</div>
				</TabsContent>

				<TabsContent value="alerts">
					<CronJobAlertsTab cronJobId={id} />
				</TabsContent>
			</Tabs>

			<CronJobForm
				open={showEdit}
				onOpenChange={setShowEdit}
				onSubmit={handleUpdate}
				cronJob={cronJob}
				channels={channelsData?.channels}
				isLoading={updateCronJob.isPending}
			/>

			<AlertDialog open={showDelete} onOpenChange={setShowDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete cron job?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{cronJob.name}" and all its ping
							history. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteCronJob.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
