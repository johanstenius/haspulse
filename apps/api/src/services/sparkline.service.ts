import type { CheckStatus, ScheduleType } from "@haspulse/db"
import type { RecentPing } from "../lib/mappers.js"
import { getExpectedRunTimes } from "../lib/schedule.js"

export type SparklineSlot = "success" | "fail" | "missed" | "empty"

type SparklineCheck = {
	status: CheckStatus
	scheduleType: ScheduleType
	scheduleValue: string
	createdAt: Date
}

export function calculateSparkline(
	check: SparklineCheck,
	pings: RecentPing[],
	count = 7,
): SparklineSlot[] {
	if (check.status === "NEW" || check.status === "PAUSED") {
		return Array(count).fill("empty")
	}

	const now = new Date()
	const expectedTimes = getExpectedRunTimes(
		check.scheduleType,
		check.scheduleValue,
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
		} else if (windowStart < check.createdAt) {
			sparkline.push("empty")
		} else {
			sparkline.push("missed")
		}
	}

	return sparkline
}
