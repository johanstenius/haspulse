import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { format, subDays } from "date-fns"

export type DayStatus = {
	date: string
	upPercent: number
}

type UptimeBarProps = {
	days: DayStatus[]
	className?: string
}

function getStatusColor(upPercent: number): string {
	if (upPercent >= 99) return "bg-success"
	if (upPercent >= 95) return "bg-warning"
	if (upPercent > 0) return "bg-destructive"
	return "bg-muted"
}

export function UptimeBar({ days, className }: UptimeBarProps) {
	const last90Days = Array.from({ length: 90 }, (_, i) => {
		const date = format(subDays(new Date(), 89 - i), "yyyy-MM-dd")
		const day = days.find((d) => d.date === date)
		return {
			date,
			upPercent: day?.upPercent ?? -1,
		}
	})

	return (
		<TooltipProvider>
			<div className={cn("flex gap-0.5", className)}>
				{last90Days.map((day) => (
					<Tooltip key={day.date}>
						<TooltipTrigger asChild>
							<div
								className={cn(
									"h-8 flex-1 rounded-sm transition-colors",
									day.upPercent === -1
										? "bg-muted"
										: getStatusColor(day.upPercent),
								)}
							/>
						</TooltipTrigger>
						<TooltipContent>
							<p className="font-medium">
								{format(new Date(day.date), "MMM d, yyyy")}
							</p>
							<p className="text-xs text-muted-foreground">
								{day.upPercent === -1
									? "No data"
									: `${day.upPercent.toFixed(1)}% uptime`}
							</p>
						</TooltipContent>
					</Tooltip>
				))}
			</div>
		</TooltipProvider>
	)
}
