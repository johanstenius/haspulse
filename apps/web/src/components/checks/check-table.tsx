"use client"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Check } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import { useDeleteCheck, usePauseCheck, useResumeCheck } from "@/lib/query"
import {
	Clock,
	History,
	MoreHorizontal,
	Pause,
	Pencil,
	Play,
	Trash2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { PingHistory } from "./ping-history"
import { StatusBadge, statusColors } from "./status-badge"

type CheckTableProps = {
	checks: Check[]
	projectId: string
	onEdit: (check: Check) => void
	onAdd?: () => void
}

export function CheckTable({
	checks,
	projectId,
	onEdit,
	onAdd,
}: CheckTableProps) {
	const pauseCheck = usePauseCheck()
	const resumeCheck = useResumeCheck()
	const deleteCheck = useDeleteCheck()
	const [deletingCheck, setDeletingCheck] = useState<Check | null>(null)
	const [historyCheck, setHistoryCheck] = useState<Check | null>(null)

	function handlePause(check: Check) {
		pauseCheck.mutate(check.id, {
			onSuccess: () => toast.success("Check paused"),
			onError: (error) => toast.error(error.message),
		})
	}

	function handleResume(check: Check) {
		resumeCheck.mutate(check.id, {
			onSuccess: () => toast.success("Check resumed"),
			onError: (error) => toast.error(error.message),
		})
	}

	function handleDelete() {
		if (!deletingCheck) return
		deleteCheck.mutate(
			{ id: deletingCheck.id, projectId },
			{
				onSuccess: () => {
					toast.success("Check deleted")
					setDeletingCheck(null)
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	function formatSchedule(check: Check): string {
		if (check.scheduleType === "CRON") {
			return check.scheduleValue
		}
		const seconds = Number.parseInt(check.scheduleValue, 10)
		if (seconds < 60) return `${seconds}s`
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
		return `${Math.floor(seconds / 86400)}d`
	}

	if (checks.length === 0) {
		return (
			<EmptyState
				icon={Clock}
				title="No checks yet"
				description="Checks monitor your cron jobs and alert you when they miss a beat."
				action={onAdd ? { label: "Add check", onClick: onAdd } : undefined}
			/>
		)
	}

	return (
		<>
			<div className="bg-card border border-border rounded-xl overflow-hidden">
				<table className="w-full text-sm text-left">
					<thead>
						<tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
							<th className="py-3 px-4 font-medium">Check</th>
							<th className="py-3 px-4 font-medium">Status</th>
							<th className="py-3 px-4 font-medium font-mono">Schedule</th>
							<th className="py-3 px-4 font-medium">Last ping</th>
							<th className="py-3 px-4 w-12" />
						</tr>
					</thead>
					<tbody className="divide-y divide-border/50">
						{checks.map((check) => {
							const isOverdue =
								check.status === "LATE" || check.status === "DOWN"
							return (
								<tr key={check.id} className="hover:bg-secondary/30">
									<td className="py-3 px-4">
										<p className="font-medium text-foreground">{check.name}</p>
										{check.slug && (
											<p className="text-xs text-muted-foreground font-mono">
												/{check.slug}
											</p>
										)}
									</td>
									<td className="py-3 px-4">
										<StatusBadge status={check.status} />
									</td>
									<td className="py-3 px-4 font-mono text-xs text-muted-foreground">
										{formatSchedule(check)}
									</td>
									<td
										className={`py-3 px-4 ${isOverdue ? statusColors[check.status] : "text-muted-foreground"}`}
									>
										{check.lastPingAt
											? formatRelativeCompactAgo(check.lastPingAt)
											: "Never"}
									</td>
									<td className="py-3 px-4">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => onEdit(check)}>
													<Pencil className="mr-2 h-4 w-4" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => setHistoryCheck(check)}
												>
													<History className="mr-2 h-4 w-4" />
													History
												</DropdownMenuItem>
												{check.status === "PAUSED" ? (
													<DropdownMenuItem onClick={() => handleResume(check)}>
														<Play className="mr-2 h-4 w-4" />
														Resume
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem onClick={() => handlePause(check)}>
														<Pause className="mr-2 h-4 w-4" />
														Pause
													</DropdownMenuItem>
												)}
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => setDeletingCheck(check)}
													className="text-destructive focus:text-destructive"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			<ConfirmDialog
				open={!!deletingCheck}
				onOpenChange={(open) => !open && setDeletingCheck(null)}
				title="Delete check"
				description={`Are you sure you want to delete "${deletingCheck?.name}"? This cannot be undone.`}
				confirmLabel="Delete"
				variant="destructive"
				onConfirm={handleDelete}
			/>

			<PingHistory
				check={historyCheck}
				open={!!historyCheck}
				onOpenChange={(open) => !open && setHistoryCheck(null)}
			/>
		</>
	)
}
