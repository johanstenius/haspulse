import { formatCronTime, getNextRuns, getRelativeTime } from "@/lib/cron"
import { Clock } from "lucide-react"

type CronBreakdownProps = {
	expression: string
	showNextRuns?: boolean
	runCount?: number
}

const FIELD_LABELS = ["Minute", "Hour", "Day of Month", "Month", "Day of Week"]

function describeFieldValue(field: string, value: string): string {
	const descriptions: Record<string, Record<string, string>> = {
		Minute: {
			"*": "Every minute (0-59)",
			"0": "At minute 0",
			"30": "At minute 30",
		},
		Hour: {
			"*": "Every hour (0-23)",
			"0": "At midnight (00:00)",
			"12": "At noon (12:00)",
		},
		"Day of Month": {
			"*": "Every day (1-31)",
			"1": "On the 1st",
			"15": "On the 15th",
			L: "On the last day",
		},
		Month: {
			"*": "Every month (1-12)",
			"1": "In January",
			"6": "In June",
		},
		"Day of Week": {
			"*": "Every day of the week",
			"0": "On Sunday",
			"1": "On Monday",
			"2": "On Tuesday",
			"3": "On Wednesday",
			"4": "On Thursday",
			"5": "On Friday",
			"6": "On Saturday",
			"1-5": "Monday through Friday",
			"0,6": "On weekends",
		},
	}

	if (descriptions[field]?.[value]) {
		return descriptions[field][value]
	}

	if (value.startsWith("*/")) {
		const interval = value.slice(2)
		const unit =
			field === "Minute"
				? "minute"
				: field === "Hour"
					? "hour"
					: field.toLowerCase()
		return `Every ${interval} ${unit}${Number(interval) > 1 ? "s" : ""}`
	}

	if (value.includes(",")) {
		return `At ${field.toLowerCase()}s: ${value}`
	}

	if (value.includes("-")) {
		const [start, end] = value.split("-")
		return `${field}s ${start} through ${end}`
	}

	return `At ${field.toLowerCase()} ${value}`
}

export function CronBreakdown({
	expression,
	showNextRuns = true,
	runCount = 5,
}: CronBreakdownProps) {
	const parts = expression.trim().split(/\s+/)
	const nextRuns = showNextRuns ? getNextRuns(expression, runCount) : []

	if (parts.length !== 5) {
		return (
			<div className="text-destructive text-sm">
				Invalid cron expression: expected 5 fields
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Field breakdown */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-3">
				{parts.map((value, index) => (
					<div
						key={FIELD_LABELS[index]}
						className="bg-card border border-border rounded-lg p-4"
					>
						<div className="font-mono text-xl text-primary mb-1">{value}</div>
						<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
							{FIELD_LABELS[index]}
						</div>
						<div className="text-sm text-foreground">
							{describeFieldValue(FIELD_LABELS[index], value)}
						</div>
					</div>
				))}
			</div>

			{/* Next runs */}
			{showNextRuns && nextRuns.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
						<Clock className="h-4 w-4" />
						Next {runCount} scheduled runs
					</h3>
					<div className="bg-card border border-border rounded-lg overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border">
									<th className="text-left px-4 py-2 text-muted-foreground font-medium">
										#
									</th>
									<th className="text-left px-4 py-2 text-muted-foreground font-medium">
										Date & Time
									</th>
									<th className="text-right px-4 py-2 text-muted-foreground font-medium">
										Relative
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{nextRuns.map((date, index) => (
									<tr key={date.toISOString()}>
										<td className="px-4 py-2 text-muted-foreground">
											{index + 1}
										</td>
										<td className="px-4 py-2 font-mono text-foreground">
											{formatCronTime(date)}
										</td>
										<td className="px-4 py-2 text-right text-muted-foreground">
											{getRelativeTime(date)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	)
}
