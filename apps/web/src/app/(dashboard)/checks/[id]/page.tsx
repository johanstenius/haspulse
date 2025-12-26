"use client"

import { CheckForm } from "@/components/checks/check-form"
import { PingSparkline } from "@/components/checks/ping-sparkline"
import { StatusBadge } from "@/components/checks/status-badge"
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PingType, UpdateCheckData } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import {
	useChannels,
	useCheck,
	useDeleteCheck,
	usePauseCheck,
	usePings,
	useResumeCheck,
	useUpdateCheck,
} from "@/lib/query"
import { cn } from "@/lib/utils"
import cronstrue from "cronstrue"
import { formatDistanceToNow } from "date-fns"
import {
	ArrowLeft,
	Check,
	Clock,
	Copy,
	Loader2,
	MoreHorizontal,
	Pause,
	Pencil,
	Play,
	Trash2,
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

export default function CheckDetailPage({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = use(params)
	const router = useRouter()
	const { data: check, isLoading } = useCheck(id)
	const { data: pingsData, isLoading: pingsLoading } = usePings(id, 50)
	const { data: channelsData } = useChannels(check?.projectId ?? "")

	const [showEdit, setShowEdit] = useState(false)
	const [showDelete, setShowDelete] = useState(false)
	const [copied, setCopied] = useState(false)

	const updateCheck = useUpdateCheck()
	const pauseCheck = usePauseCheck()
	const resumeCheck = useResumeCheck()
	const deleteCheck = useDeleteCheck()

	const hasAnyBody = useMemo(() => {
		return pingsData?.pings.some((p) => p.body) ?? false
	}, [pingsData?.pings])

	function handleUpdate(data: UpdateCheckData & { channelIds?: string[] }) {
		if (!check) return
		updateCheck.mutate(
			{ id: check.id, data },
			{
				onSuccess: () => {
					setShowEdit(false)
					toast.success("Check updated")
				},
				onError: (error) => {
					toast.error(error.message)
				},
			},
		)
	}

	function handlePause() {
		if (!check) return
		pauseCheck.mutate(check.id, {
			onSuccess: () => toast.success("Check paused"),
			onError: (error) => toast.error(error.message),
		})
	}

	function handleResume() {
		if (!check) return
		resumeCheck.mutate(check.id, {
			onSuccess: () => toast.success("Check resumed"),
			onError: (error) => toast.error(error.message),
		})
	}

	function handleDelete() {
		if (!check) return
		deleteCheck.mutate(
			{ id: check.id, projectId: check.projectId },
			{
				onSuccess: () => {
					toast.success("Check deleted")
					router.push(`/projects/${check.projectId}`)
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	function handleCopyUrl() {
		if (!check?.slug) return
		const url = `${window.location.origin}/ping/${check.slug}`
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

	if (!check) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">Check not found</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard">Back to dashboard</Link>
				</Button>
			</div>
		)
	}

	const isPaused = check.status === "PAUSED"
	const isActioning =
		pauseCheck.isPending || resumeCheck.isPending || deleteCheck.isPending

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4 mb-6">
				<div className="flex items-start gap-3">
					<Button variant="ghost" size="icon" className="mt-1" asChild>
						<Link href={`/projects/${check.projectId}`}>
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-display text-2xl font-semibold">
								{check.name}
							</h1>
							<StatusBadge status={check.status} />
						</div>
						{check.slug && (
							<button
								type="button"
								onClick={handleCopyUrl}
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mt-0.5 group"
							>
								<span className="font-mono text-sm">/{check.slug}</span>
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

			{/* Stats Panel */}
			<div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl shadow-black/10 mb-6">
				<div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Schedule
						</div>
						<div className="font-medium text-foreground">
							{formatSchedule(check.scheduleType, check.scheduleValue)}
						</div>
						{check.scheduleType === "CRON" && (
							<div className="font-mono text-xs text-muted-foreground mt-0.5">
								{check.scheduleValue}
							</div>
						)}
					</div>
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Grace Period
						</div>
						<div className="font-medium text-foreground">
							{formatGrace(check.graceSeconds)}
						</div>
					</div>
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Last Ping
						</div>
						<div className="font-medium text-foreground">
							{check.lastPingAt
								? formatRelativeCompactAgo(check.lastPingAt)
								: "Never"}
						</div>
					</div>
					<div className="p-4">
						<div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
							Recent Activity
						</div>
						<div className="flex items-center gap-3">
							<PingSparkline sparkline={check.sparkline} />
							<span className="text-xs text-muted-foreground">
								{pingsData?.pings.length ?? 0} total
							</span>
						</div>
					</div>
				</div>
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
								/ping/{check.slug}
							</code>
						</p>
					</div>
				) : (
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
												<span className="text-muted-foreground/50">—</span>
											)}
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			<CheckForm
				open={showEdit}
				onOpenChange={setShowEdit}
				onSubmit={handleUpdate}
				check={check}
				channels={channelsData?.channels}
				isLoading={updateCheck.isPending}
			/>

			<AlertDialog open={showDelete} onOpenChange={setShowDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete check?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{check.name}" and all its ping
							history. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteCheck.isPending ? (
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
