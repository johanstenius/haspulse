import type { ScheduleType } from "@haspulse/db"
import { CronExpressionParser } from "cron-parser"

export function calculateNextExpected(
	scheduleType: ScheduleType,
	scheduleValue: string,
	fromDate: Date,
	timezone?: string | null,
): Date {
	if (scheduleType === "PERIOD") {
		const seconds = Number.parseInt(scheduleValue, 10)
		if (Number.isNaN(seconds) || seconds <= 0) {
			throw new Error(`Invalid period value: ${scheduleValue}`)
		}
		return new Date(fromDate.getTime() + seconds * 1000)
	}

	const interval = CronExpressionParser.parse(scheduleValue, {
		currentDate: fromDate,
		tz: timezone ?? "UTC",
	})
	return interval.next().toDate()
}
