import type { ScheduleType } from "@haspulse/db"
import { CronExpressionParser } from "cron-parser"

export function getExpectedRunTimes(
	scheduleType: ScheduleType,
	scheduleValue: string,
	count: number,
	fromDate: Date,
	timezone?: string | null,
): Date[] {
	const times: Date[] = []

	if (scheduleType === "PERIOD") {
		const seconds = Number.parseInt(scheduleValue, 10)
		if (Number.isNaN(seconds) || seconds <= 0) {
			return times
		}
		let current = fromDate.getTime()
		for (let i = 0; i < count; i++) {
			current -= seconds * 1000
			times.unshift(new Date(current))
		}
		return times
	}

	const interval = CronExpressionParser.parse(scheduleValue, {
		currentDate: fromDate,
		tz: timezone ?? "UTC",
	})
	for (let i = 0; i < count; i++) {
		times.unshift(interval.prev().toDate())
	}
	return times
}

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
