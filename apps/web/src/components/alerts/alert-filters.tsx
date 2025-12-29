"use client"

import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { AlertEvent } from "@/lib/api"
import { useCronJobs, useProjects } from "@/lib/query"
import { X } from "lucide-react"

type AlertFiltersProps = {
	projectId: string | undefined
	cronJobId: string | undefined
	event: AlertEvent | undefined
	onProjectChange: (projectId: string | undefined) => void
	onCronJobChange: (cronJobId: string | undefined) => void
	onEventChange: (event: AlertEvent | undefined) => void
}

const EVENT_OPTIONS: { value: AlertEvent | "ALL"; label: string }[] = [
	{ value: "ALL", label: "All events" },
	{ value: "cronJob.down", label: "Down" },
	{ value: "cronJob.up", label: "Recovered" },
	{ value: "cronJob.still_down", label: "Still Down" },
]

const DROPDOWN_CRON_JOBS_LIMIT = 500

export function AlertFilters({
	projectId,
	cronJobId,
	event,
	onProjectChange,
	onCronJobChange,
	onEventChange,
}: AlertFiltersProps) {
	const { data: projectsData } = useProjects()
	const { data: cronJobsData } = useCronJobs(projectId ?? "", {
		limit: DROPDOWN_CRON_JOBS_LIMIT,
	})

	const projects = projectsData?.projects ?? []
	const cronJobs = cronJobsData?.cronJobs ?? []

	const hasFilters = projectId || cronJobId || event

	return (
		<div className="flex gap-3 flex-wrap">
			<Select
				value={projectId ?? "ALL"}
				onValueChange={(v) => {
					onProjectChange(v === "ALL" ? undefined : v)
					onCronJobChange(undefined)
				}}
			>
				<SelectTrigger className="w-40">
					<SelectValue placeholder="All projects" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ALL">All projects</SelectItem>
					{projects.map((project) => (
						<SelectItem key={project.id} value={project.id}>
							{project.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={cronJobId ?? "ALL"}
				onValueChange={(v) => onCronJobChange(v === "ALL" ? undefined : v)}
				disabled={!projectId}
			>
				<SelectTrigger className="w-40">
					<SelectValue placeholder="All cron jobs" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ALL">All cron jobs</SelectItem>
					{cronJobs.map((cronJob) => (
						<SelectItem key={cronJob.id} value={cronJob.id}>
							{cronJob.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={event ?? "ALL"}
				onValueChange={(v) =>
					onEventChange(v === "ALL" ? undefined : (v as AlertEvent))
				}
			>
				<SelectTrigger className="w-36">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{EVENT_OPTIONS.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{hasFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						onProjectChange(undefined)
						onCronJobChange(undefined)
						onEventChange(undefined)
					}}
				>
					<X className="h-4 w-4 mr-1" /> Clear
				</Button>
			)}
		</div>
	)
}
