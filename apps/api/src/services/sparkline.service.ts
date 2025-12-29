import type { MonitorStatus, ScheduleType } from "@haspulse/db"
import type { RecentPing } from "../lib/mappers.js"
import { getExpectedRunTimes } from "../lib/schedule.js"

export type SparklineSlot = "success" | "fail" | "missed" | "empty"

type SparklineCronJob = {
	status: MonitorStatus
	scheduleType: ScheduleType
	scheduleValue: string
	createdAt: Date
}

export function calculateSparkline(
	cronJob: SparklineCronJob,
	pings: RecentPing[],
	count = 7,
): SparklineSlot[] {
	if (cronJob.status === "NEW" || cronJob.status === "PAUSED") {
		return Array(count).fill("empty")
	}

	const now = new Date()
	const expectedTimes = getExpectedRunTimes(
		cronJob.scheduleType,
		cronJob.scheduleValue,
		count,
		now,
	)

	if (expectedTimes.length === 0) {
		return Array(count).fill("empty")
	}

	const outcomes = pings.filter((p) => p.type !== "START")
	const sparkline: SparklineSlot[] = []

	for (let i = 0; i < expectedTimes.length; i++) {
		const windowStart = expectedTimes[i]
		if (!windowStart) continue
		const windowEnd = expectedTimes[i + 1] ?? now

		const ping = outcomes.find(
			(p) => p.createdAt >= windowStart && p.createdAt < windowEnd,
		)

		if (ping) {
			sparkline.push(ping.type === "SUCCESS" ? "success" : "fail")
		} else if (windowStart < cronJob.createdAt) {
			sparkline.push("empty")
		} else {
			sparkline.push("missed")
		}
	}

	return sparkline
}
