"use client"

import { HttpMonitorForm } from "@/components/http-monitors/http-monitor-form"
import { PingSparkline } from "@/components/cron-jobs/ping-sparkline"
import { StatusBadge } from "@/components/cron-jobs/status-badge"
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { UpdateHttpMonitorData } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import {
	useChannels,
	useDeleteHttpMonitor,
	useHttpMonitor,
	usePauseHttpMonitor,
	useResumeHttpMonitor,
	useUpdateHttpMonitor,
} from "@/lib/query"
import {
	ArrowLeft,
	Clock,
	ExternalLink,
	Globe,
	Loader2,
	MoreHorizontal,
	Pause,
	Pencil,
	Play,
	Timer,
	Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useState } from "react"
import { toast } from "sonner"

function formatInterval(seconds: number): string {
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	return `${Math.floor(seconds / 3600)}h`
}

function formatGrace(seconds: number): string {
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	return `${Math.floor(seconds / 3600)}h`
}

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="p-4">
			<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
				{label}
			</div>
			<div className="font-medium text-foreground">{value}</div>
		</div>
	)
}

export default function HttpMonitorDetailPage({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = use(params)
	const router = useRouter()
	const [showEdit, setShowEdit] = useState(false)
	const [showDelete, setShowDelete] = useState(false)

	const { data: httpMonitor, isLoading } = useHttpMonitor(id)
	const { data: channelsData } = useChannels(httpMonitor?.projectId ?? "")

	const updateHttpMonitor = useUpdateHttpMonitor()
	const pauseHttpMonitor = usePauseHttpMonitor()
	const resumeHttpMonitor = useResumeHttpMonitor()
	const deleteHttpMonitor = useDeleteHttpMonitor()

	function handleUpdate(data: UpdateHttpMonitorData & { channelIds?: string[] }) {
		if (!httpMonitor) return
		updateHttpMonitor.mutate(
			{ id: httpMonitor.id, data },
			{
				onSuccess: () => {
					setShowEdit(false)
					toast.success("HTTP monitor updated")
				},
				onError: (error) => {
					toast.error(error.message)
				},
			},
		)
	}

	function handlePause() {
		if (!httpMonitor) return
		pauseHttpMonitor.mutate(httpMonitor.id, {
			onSuccess: () => toast.success("HTTP monitor paused"),
			onError: (error) => toast.error(error.message),
		})
	}

	function handleResume() {
		if (!httpMonitor) return
		resumeHttpMonitor.mutate(httpMonitor.id, {
			onSuccess: () => toast.success("HTTP monitor resumed"),
			onError: (error) => toast.error(error.message),
		})
	}

	function handleDelete() {
		if (!httpMonitor) return
		deleteHttpMonitor.mutate(
			{ id: httpMonitor.id, projectId: httpMonitor.projectId },
			{
				onSuccess: () => {
					toast.success("HTTP monitor deleted")
					router.push(`/projects/${httpMonitor.projectId}`)
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	if (isLoading) {
		return (
			<div className="p-6">
				<Skeleton className="h-8 w-48 mb-4" />
				<Skeleton className="h-64" />
			</div>
		)
	}

	if (!httpMonitor) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">HTTP monitor not found</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard">Back to dashboard</Link>
				</Button>
			</div>
		)
	}

	const isPaused = httpMonitor.status === "PAUSED"
	const isActioning =
		pauseHttpMonitor.isPending || resumeHttpMonitor.isPending || deleteHttpMonitor.isPending

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4 mb-6">
				<div className="flex items-start gap-3">
					<Button variant="ghost" size="icon" className="mt-1" asChild>
						<Link href={`/projects/${httpMonitor.projectId}`}>
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-display text-2xl font-semibold">
								{httpMonitor.name}
							</h1>
							<StatusBadge status={httpMonitor.status} />
						</div>
						<a
							href={httpMonitor.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mt-0.5 group"
						>
							<span className="font-mono text-sm truncate max-w-[300px]">
								{httpMonitor.method} {new URL(httpMonitor.url).hostname}
							</span>
							<ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
						</a>
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

			{/* Main Stats Panel */}
			<div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl shadow-black/10 mb-6">
				<div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Endpoint
						</div>
						<div className="font-medium text-foreground truncate">
							<Tooltip>
								<TooltipTrigger className="truncate block">
									{httpMonitor.url}
								</TooltipTrigger>
								<TooltipContent side="bottom" className="max-w-md">
									<span className="font-mono text-xs break-all">{httpMonitor.url}</span>
								</TooltipContent>
							</Tooltip>
						</div>
						<div className="text-xs text-muted-foreground mt-0.5">
							<Badge variant="secondary" className="text-xs px-1.5 py-0">
								{httpMonitor.method}
							</Badge>
						</div>
					</div>
					<StatCell label="Check Interval" value={formatInterval(httpMonitor.interval)} />
					<StatCell label="Grace Period" value={formatGrace(httpMonitor.graceSeconds)} />
					<StatCell label="Timeout" value={`${httpMonitor.timeout}s`} />
				</div>
			</div>

			{/* Status Panel */}
			<div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl shadow-black/10 mb-6">
				<div className="px-4 py-3 border-b border-border flex items-center gap-2">
					<Globe className="h-4 w-4 text-muted-foreground" />
					<h2 className="font-medium">Current Status</h2>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Last Check
						</div>
						<div className="font-medium text-foreground">
							{httpMonitor.lastCheckedAt
								? formatRelativeCompactAgo(httpMonitor.lastCheckedAt)
								: "Never"}
						</div>
					</div>
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Response Time
						</div>
						<div className="font-medium text-foreground font-mono">
							{httpMonitor.lastResponseMs !== null
								? `${httpMonitor.lastResponseMs}ms`
								: "—"}
						</div>
					</div>
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Expected Status
						</div>
						<div className="font-medium text-foreground font-mono">
							{httpMonitor.expectedStatus}
						</div>
					</div>
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Recent Activity
						</div>
						<PingSparkline sparkline={httpMonitor.sparkline} />
					</div>
				</div>
			</div>

			{/* Configuration Panel */}
			<div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl shadow-black/10">
				<div className="px-4 py-3 border-b border-border flex items-center gap-2">
					<Timer className="h-4 w-4 text-muted-foreground" />
					<h2 className="font-medium">Configuration</h2>
				</div>
				<div className="p-4 space-y-3">
					{httpMonitor.headers && Object.keys(httpMonitor.headers).length > 0 && (
						<div>
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Headers
							</div>
							<pre className="text-xs font-mono bg-muted/50 p-2 rounded-md overflow-x-auto">
								{JSON.stringify(httpMonitor.headers, null, 2)}
							</pre>
						</div>
					)}
					{httpMonitor.body && (
						<div>
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Request Body
							</div>
							<pre className="text-xs font-mono bg-muted/50 p-2 rounded-md overflow-x-auto">
								{httpMonitor.body}
							</pre>
						</div>
					)}
					{httpMonitor.expectedBody && (
						<div>
							<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
								Expected Body Contains
							</div>
							<code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded-md">
								{httpMonitor.expectedBody}
							</code>
						</div>
					)}
					{!httpMonitor.headers && !httpMonitor.body && !httpMonitor.expectedBody && (
						<div className="text-center py-6 text-muted-foreground">
							<Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No advanced configuration</p>
						</div>
					)}
					<div className="pt-3 border-t border-border">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Alert on recovery</span>
							<Badge variant={httpMonitor.alertOnRecovery ? "default" : "secondary"}>
								{httpMonitor.alertOnRecovery ? "Enabled" : "Disabled"}
							</Badge>
						</div>
					</div>
				</div>
			</div>

			<HttpMonitorForm
				open={showEdit}
				onOpenChange={setShowEdit}
				onSubmit={handleUpdate}
				httpMonitor={httpMonitor}
				channels={channelsData?.channels}
				isLoading={updateHttpMonitor.isPending}
			/>

			<AlertDialog open={showDelete} onOpenChange={setShowDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete HTTP monitor?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{httpMonitor.name}" and all its
							check history. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteHttpMonitor.isPending ? (
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
