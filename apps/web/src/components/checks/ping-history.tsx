"use client"

import { Badge } from "@/components/ui/badge"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { Check, PingType } from "@/lib/api"
import { usePings } from "@/lib/query"
import { formatDistanceToNow } from "date-fns"

type PingHistoryProps = {
	check: Check | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

const pingTypeColors: Record<PingType, string> = {
	SUCCESS: "bg-green-500/10 text-green-600 border-green-500/20",
	START: "bg-blue-500/10 text-blue-600 border-blue-500/20",
	FAIL: "bg-red-500/10 text-red-600 border-red-500/20",
}

const pingTypeLabels: Record<PingType, string> = {
	SUCCESS: "Success",
	START: "Start",
	FAIL: "Fail",
}

export function PingHistory({ check, open, onOpenChange }: PingHistoryProps) {
	const { data, isLoading } = usePings(check?.id ?? "", 50)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Ping History</DialogTitle>
					<DialogDescription>
						Recent pings for {check?.name ?? "this check"}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				) : data?.pings.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						No pings recorded yet
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Time</TableHead>
								<TableHead>Source IP</TableHead>
								<TableHead>Body</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.pings.map((ping) => (
								<TableRow key={ping.id}>
									<TableCell>
										<Badge
											variant="outline"
											className={pingTypeColors[ping.type]}
										>
											{pingTypeLabels[ping.type]}
										</Badge>
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{formatDistanceToNow(new Date(ping.createdAt), {
											addSuffix: true,
										})}
									</TableCell>
									<TableCell className="font-mono text-sm">
										{ping.sourceIp}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
										{ping.body || "-"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</DialogContent>
		</Dialog>
	)
}
