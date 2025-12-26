"use client"

import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { AlertEvent, Project } from "@/lib/api"
import { useChecks, useProjects } from "@/lib/query"
import { X } from "lucide-react"

type AlertFiltersProps = {
	projectId: string | undefined
	checkId: string | undefined
	event: AlertEvent | undefined
	onProjectChange: (projectId: string | undefined) => void
	onCheckChange: (checkId: string | undefined) => void
	onEventChange: (event: AlertEvent | undefined) => void
}

const EVENT_OPTIONS: { value: AlertEvent | "ALL"; label: string }[] = [
	{ value: "ALL", label: "All events" },
	{ value: "check.down", label: "Down" },
	{ value: "check.up", label: "Recovered" },
	{ value: "check.still_down", label: "Still Down" },
]

const DROPDOWN_CHECKS_LIMIT = 500

export function AlertFilters({
	projectId,
	checkId,
	event,
	onProjectChange,
	onCheckChange,
	onEventChange,
}: AlertFiltersProps) {
	const { data: projectsData } = useProjects()
	const { data: checksData } = useChecks(projectId ?? "", {
		limit: DROPDOWN_CHECKS_LIMIT,
	})

	const projects = projectsData?.projects ?? []
	const checks = checksData?.checks ?? []

	const hasFilters = projectId || checkId || event

	return (
		<div className="flex gap-3 flex-wrap">
			<Select
				value={projectId ?? "ALL"}
				onValueChange={(v) => {
					onProjectChange(v === "ALL" ? undefined : v)
					onCheckChange(undefined)
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
				value={checkId ?? "ALL"}
				onValueChange={(v) => onCheckChange(v === "ALL" ? undefined : v)}
				disabled={!projectId}
			>
				<SelectTrigger className="w-40">
					<SelectValue placeholder="All checks" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ALL">All checks</SelectItem>
					{checks.map((check) => (
						<SelectItem key={check.id} value={check.id}>
							{check.name}
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
						onCheckChange(undefined)
						onEventChange(undefined)
					}}
				>
					<X className="h-4 w-4 mr-1" /> Clear
				</Button>
			)}
		</div>
	)
}
