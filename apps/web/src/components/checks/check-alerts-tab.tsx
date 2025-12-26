"use client"

import { AlertTable } from "@/components/alerts/alert-table"
import { PaginationControls } from "@/components/pagination-controls"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { AlertEvent } from "@/lib/api"
import { useCheckAlerts } from "@/lib/query"
import { useState } from "react"

const DEFAULT_LIMIT = 20

const EVENT_OPTIONS: { value: AlertEvent | "ALL"; label: string }[] = [
	{ value: "ALL", label: "All events" },
	{ value: "check.down", label: "Down" },
	{ value: "check.up", label: "Recovered" },
	{ value: "check.still_down", label: "Still Down" },
]

type CheckAlertsTabProps = {
	checkId: string
}

export function CheckAlertsTab({ checkId }: CheckAlertsTabProps) {
	const [page, setPage] = useState(1)
	const [event, setEvent] = useState<AlertEvent | undefined>(undefined)

	const { data, isLoading } = useCheckAlerts(checkId, {
		page,
		limit: DEFAULT_LIMIT,
		event,
	})

	function handleEventChange(value: string) {
		setEvent(value === "ALL" ? undefined : (value as AlertEvent))
		setPage(1)
	}

	if (isLoading) {
		return <Skeleton className="h-48" />
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Select value={event ?? "ALL"} onValueChange={handleEventChange}>
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
			</div>
			<AlertTable alerts={data?.alerts ?? []} />
			{data && data.totalPages > 1 && (
				<PaginationControls
					page={page}
					totalPages={data.totalPages}
					onPageChange={setPage}
				/>
			)}
		</div>
	)
}
