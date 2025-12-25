import {
	type DailyStatModel,
	statsRepository,
} from "../repositories/stats.repository.js"

export type UptimeDay = {
	date: string
	upPercent: number
	upMinutes: number
	downMinutes: number
	totalPings: number
}

export type CheckUptimeHistory = {
	checkId: string
	days: UptimeDay[]
}

function formatDate(date: Date): string {
	return date.toISOString().slice(0, 10)
}

function getDateRange(days: number): { startDate: Date; endDate: Date } {
	const endDate = new Date()
	endDate.setHours(0, 0, 0, 0)

	const startDate = new Date(endDate)
	startDate.setDate(startDate.getDate() - days + 1)

	return { startDate, endDate }
}

function statToUptimeDay(stat: DailyStatModel): UptimeDay {
	return {
		date: formatDate(stat.date),
		upPercent: Math.round(stat.upPercent * 100) / 100,
		upMinutes: stat.upMinutes,
		downMinutes: stat.downMinutes,
		totalPings: stat.totalPings,
	}
}

function fillMissingDays(
	stats: DailyStatModel[],
	startDate: Date,
	endDate: Date,
): UptimeDay[] {
	const result: UptimeDay[] = []
	const statsByDate = new Map<string, DailyStatModel>()

	for (const stat of stats) {
		statsByDate.set(formatDate(stat.date), stat)
	}

	const current = new Date(startDate)
	while (current <= endDate) {
		const dateStr = formatDate(current)
		const stat = statsByDate.get(dateStr)

		if (stat) {
			result.push(statToUptimeDay(stat))
		} else {
			result.push({
				date: dateStr,
				upPercent: 0,
				upMinutes: 0,
				downMinutes: 0,
				totalPings: 0,
			})
		}

		current.setDate(current.getDate() + 1)
	}

	return result
}

export async function getCheckUptimeHistory(
	checkId: string,
	days: number,
): Promise<CheckUptimeHistory> {
	const { startDate, endDate } = getDateRange(days)

	const stats = await statsRepository.findByCheckIdAndDateRange(
		checkId,
		startDate,
		endDate,
	)

	return {
		checkId,
		days: fillMissingDays(stats, startDate, endDate),
	}
}

export async function getChecksUptimeHistory(
	checkIds: string[],
	days: number,
): Promise<Map<string, UptimeDay[]>> {
	const { startDate, endDate } = getDateRange(days)

	const stats = await statsRepository.findByCheckIdsAndDateRange(
		checkIds,
		startDate,
		endDate,
	)

	const statsByCheck = new Map<string, DailyStatModel[]>()
	for (const stat of stats) {
		const existing = statsByCheck.get(stat.checkId) ?? []
		existing.push(stat)
		statsByCheck.set(stat.checkId, existing)
	}

	const result = new Map<string, UptimeDay[]>()
	for (const checkId of checkIds) {
		const checkStats = statsByCheck.get(checkId) ?? []
		result.set(checkId, fillMissingDays(checkStats, startDate, endDate))
	}

	return result
}

export async function recordCheckStatus(
	checkId: string,
	status: string,
): Promise<void> {
	const now = new Date()

	if (status === "UP") {
		await statsRepository.incrementStat(checkId, now, "upMinutes")
	} else if (status === "DOWN" || status === "LATE") {
		await statsRepository.incrementStat(checkId, now, "downMinutes")
	}
	// NEW and PAUSED don't count towards uptime
}

export async function recordPing(checkId: string): Promise<void> {
	const now = new Date()
	await statsRepository.incrementStat(checkId, now, "totalPings")
}
