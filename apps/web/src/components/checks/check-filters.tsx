"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { CheckStatus } from "@/lib/api"
import { Search, X } from "lucide-react"
import { useEffect, useRef } from "react"
import { useDebouncedCallback } from "use-debounce"

type CheckFiltersProps = {
	search: string
	status: CheckStatus | undefined
	onSearchChange: (search: string) => void
	onStatusChange: (status: CheckStatus | undefined) => void
}

const STATUS_OPTIONS: { value: CheckStatus | "ALL"; label: string }[] = [
	{ value: "ALL", label: "All statuses" },
	{ value: "UP", label: "Up" },
	{ value: "DOWN", label: "Down" },
	{ value: "LATE", label: "Late" },
	{ value: "NEW", label: "New" },
	{ value: "PAUSED", label: "Paused" },
]

export function CheckFilters({
	search,
	status,
	onSearchChange,
	onStatusChange,
}: CheckFiltersProps) {
	const inputRef = useRef<HTMLInputElement>(null)

	const debouncedSearch = useDebouncedCallback((value: string) => {
		onSearchChange(value)
	}, 300)

	// Sync input with external search prop changes (clear, browser nav)
	useEffect(() => {
		if (inputRef.current && inputRef.current.value !== search) {
			inputRef.current.value = search
		}
	}, [search])

	return (
		<div className="flex gap-3 flex-1">
			<div className="relative flex-1 max-w-xs">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					ref={inputRef}
					placeholder="Search checks..."
					defaultValue={search}
					onChange={(e) => debouncedSearch(e.target.value)}
					className="pl-9"
				/>
			</div>
			<Select
				value={status ?? "ALL"}
				onValueChange={(v) =>
					onStatusChange(v === "ALL" ? undefined : (v as CheckStatus))
				}
			>
				<SelectTrigger className="w-36">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{STATUS_OPTIONS.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{(search || status) && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						onSearchChange("")
						onStatusChange(undefined)
					}}
				>
					<X className="h-4 w-4 mr-1" /> Clear
				</Button>
			)}
		</div>
	)
}
