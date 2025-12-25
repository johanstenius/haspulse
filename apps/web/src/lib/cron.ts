import { CronExpressionParser } from "cron-parser"

export type CronField = {
	name: string
	value: string
	description: string
}

export type ParsedCron = {
	isValid: boolean
	error?: string
	fields?: CronField[]
	humanReadable?: string
	nextRuns?: Date[]
}

const FIELD_NAMES = [
	"minute",
	"hour",
	"day of month",
	"month",
	"day of week",
] as const

function describeField(name: string, value: string): string {
	if (value === "*") return `every ${name}`
	if (value.startsWith("*/")) {
		const interval = value.slice(2)
		return `every ${interval} ${name}${Number(interval) > 1 ? "s" : ""}`
	}
	if (value.includes(",")) return `at ${name}s ${value}`
	if (value.includes("-")) {
		const [start, end] = value.split("-")
		return `${name}s ${start} through ${end}`
	}
	return `at ${name} ${value}`
}

function generateHumanReadable(expression: string): string {
	const parts = expression.trim().split(/\s+/)
	if (parts.length !== 5) return expression

	const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

	// Common patterns
	if (expression === "* * * * *") return "Every minute"
	if (expression === "0 * * * *") return "Every hour, on the hour"
	if (expression === "0 0 * * *") return "Every day at midnight"
	if (expression === "0 0 * * 0") return "Every Sunday at midnight"
	if (expression === "0 0 1 * *") return "First day of every month at midnight"

	// Every N minutes
	if (
		minute.startsWith("*/") &&
		hour === "*" &&
		dayOfMonth === "*" &&
		month === "*" &&
		dayOfWeek === "*"
	) {
		const interval = minute.slice(2)
		return `Every ${interval} minute${Number(interval) > 1 ? "s" : ""}`
	}

	// Every N hours
	if (
		minute === "0" &&
		hour.startsWith("*/") &&
		dayOfMonth === "*" &&
		month === "*" &&
		dayOfWeek === "*"
	) {
		const interval = hour.slice(2)
		return `Every ${interval} hour${Number(interval) > 1 ? "s" : ""}`
	}

	// Daily at specific time
	if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
		if (minute !== "*" && hour !== "*") {
			const hourNum = Number(hour)
			const minuteNum = Number(minute)
			const period = hourNum >= 12 ? "PM" : "AM"
			const displayHour =
				hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
			const displayMinute = minuteNum.toString().padStart(2, "0")
			return `Every day at ${displayHour}:${displayMinute} ${period}`
		}
	}

	// Weekly on specific day
	if (dayOfMonth === "*" && month === "*" && dayOfWeek !== "*") {
		const days = [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
		]
		const dayName = days[Number(dayOfWeek)] || dayOfWeek

		if (minute === "0" && hour === "0") {
			return `Every ${dayName} at midnight`
		}

		if (minute !== "*" && hour !== "*") {
			const hourNum = Number(hour)
			const minuteNum = Number(minute)
			const period = hourNum >= 12 ? "PM" : "AM"
			const displayHour =
				hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
			const displayMinute = minuteNum.toString().padStart(2, "0")
			return `Every ${dayName} at ${displayHour}:${displayMinute} ${period}`
		}
	}

	// Monthly on specific day
	if (dayOfMonth !== "*" && month === "*" && dayOfWeek === "*") {
		const day = Number(dayOfMonth)
		const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"

		if (minute === "0" && hour === "0") {
			return `On the ${day}${suffix} of every month at midnight`
		}
	}

	// Fallback to field descriptions
	const descriptions: string[] = []

	if (minute !== "*") descriptions.push(describeField("minute", minute))
	if (hour !== "*") descriptions.push(describeField("hour", hour))
	if (dayOfMonth !== "*") descriptions.push(describeField("day", dayOfMonth))
	if (month !== "*") descriptions.push(describeField("month", month))
	if (dayOfWeek !== "*")
		descriptions.push(`on ${describeField("day of week", dayOfWeek)}`)

	return descriptions.length > 0 ? descriptions.join(", ") : expression
}

export function parseCronExpression(
	expression: string,
	count = 10,
): ParsedCron {
	try {
		const cronExpr = CronExpressionParser.parse(expression.trim())
		const nextRuns: Date[] = []

		for (let i = 0; i < count; i++) {
			nextRuns.push(cronExpr.next().toDate())
		}

		const parts = expression.trim().split(/\s+/)
		const fields: CronField[] = parts.map((value, index) => ({
			name: FIELD_NAMES[index] || `field ${index}`,
			value,
			description: describeField(FIELD_NAMES[index] || "", value),
		}))

		return {
			isValid: true,
			fields,
			humanReadable: generateHumanReadable(expression),
			nextRuns,
		}
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Invalid cron expression",
		}
	}
}

export function getNextRuns(
	expression: string,
	count = 10,
	from?: Date,
): Date[] {
	try {
		const cronExpr = CronExpressionParser.parse(expression.trim(), {
			currentDate: from || new Date(),
		})
		const runs: Date[] = []

		for (let i = 0; i < count; i++) {
			runs.push(cronExpr.next().toDate())
		}

		return runs
	} catch {
		return []
	}
}

export function isValidCronExpression(expression: string): boolean {
	try {
		CronExpressionParser.parse(expression.trim())
		return true
	} catch {
		return false
	}
}

export function formatCronTime(date: Date): string {
	return date.toLocaleString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	})
}

export function getRelativeTime(date: Date): string {
	const now = new Date()
	const diffMs = date.getTime() - now.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffMins < 1) return "in less than a minute"
	if (diffMins < 60) return `in ${diffMins} minute${diffMins > 1 ? "s" : ""}`
	if (diffHours < 24) return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`
	return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`
}
