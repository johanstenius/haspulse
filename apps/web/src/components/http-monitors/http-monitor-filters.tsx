"use client"

import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { MonitorStatus } from "@/lib/api"
import { Search } from "lucide-react"

type HttpMonitorFiltersProps = {
	search: string
	status: MonitorStatus | undefined
	onSearchChange: (search: string) => void
	onStatusChange: (status: MonitorStatus | undefined) => void
}

export function HttpMonitorFilters({
	search,
	status,
	onSearchChange,
	onStatusChange,
}: HttpMonitorFiltersProps) {
	return (
		<div className="flex gap-3">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search monitors..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-9 w-[200px]"
				/>
			</div>
			<Select
				value={status ?? "all"}
				onValueChange={(v) =>
					onStatusChange(v === "all" ? undefined : (v as MonitorStatus))
				}
			>
				<SelectTrigger className="w-[140px]">
					<SelectValue placeholder="All statuses" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All statuses</SelectItem>
					<SelectItem value="UP">Up</SelectItem>
					<SelectItem value="LATE">Late</SelectItem>
					<SelectItem value="DOWN">Down</SelectItem>
					<SelectItem value="PAUSED">Paused</SelectItem>
					<SelectItem value="NEW">New</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)
}
