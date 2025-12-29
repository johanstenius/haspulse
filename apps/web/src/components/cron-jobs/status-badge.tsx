import type { MonitorStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

type StatusBadgeProps = {
	status: MonitorStatus
	className?: string
}

export const statusColors: Record<MonitorStatus, string> = {
	UP: "text-primary",
	DOWN: "text-destructive",
	LATE: "text-warning",
	NEW: "text-chart-2",
	PAUSED: "text-muted-foreground",
}

const statusConfig: Record<
	MonitorStatus,
	{ label: string; dotColor: string; textColor: string }
> = {
	UP: {
		label: "UP",
		dotColor: "bg-primary",
		textColor: "text-primary",
	},
	DOWN: {
		label: "DOWN",
		dotColor: "bg-destructive",
		textColor: "text-destructive",
	},
	LATE: {
		label: "LATE",
		dotColor: "bg-warning",
		textColor: "text-warning",
	},
	NEW: {
		label: "NEW",
		dotColor: "bg-chart-2",
		textColor: "text-chart-2",
	},
	PAUSED: {
		label: "PAUSED",
		dotColor: "bg-muted-foreground",
		textColor: "text-muted-foreground",
	},
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = statusConfig[status]

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-xs font-medium",
				config.textColor,
				className,
			)}
		>
			<span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
			{config.label}
		</span>
	)
}
