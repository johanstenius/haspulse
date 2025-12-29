import {
	type DailyStatModel,
	type HttpMonitorDailyStatModel,
	statsRepository,
} from "../repositories/stats.repository.js"

export type UptimeDay = {
	date: string
	upPercent: number
	upMinutes: number
	downMinutes: number
	totalPings: number
}

export type CronJobUptimeHistory = {
	cronJobId: string
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

export async function getCronJobUptimeHistory(
	cronJobId: string,
	days: number,
): Promise<CronJobUptimeHistory> {
	const { startDate, endDate } = getDateRange(days)

	const stats = await statsRepository.findByCronJobIdAndDateRange(
		cronJobId,
		startDate,
		endDate,
	)

	return {
		cronJobId,
		days: fillMissingDays(stats, startDate, endDate),
	}
}

export async function getCronJobsUptimeHistory(
	cronJobIds: string[],
	days: number,
): Promise<Map<string, UptimeDay[]>> {
	const { startDate, endDate } = getDateRange(days)

	const stats = await statsRepository.findByCronJobIdsAndDateRange(
		cronJobIds,
		startDate,
		endDate,
	)

	const statsByCronJob = new Map<string, DailyStatModel[]>()
	for (const stat of stats) {
		const existing = statsByCronJob.get(stat.cronJobId) ?? []
		existing.push(stat)
		statsByCronJob.set(stat.cronJobId, existing)
	}

	const result = new Map<string, UptimeDay[]>()
	for (const cronJobId of cronJobIds) {
		const cronJobStats = statsByCronJob.get(cronJobId) ?? []
		result.set(cronJobId, fillMissingDays(cronJobStats, startDate, endDate))
	}

	return result
}

export async function recordCronJobStatus(
	cronJobId: string,
	status: string,
): Promise<void> {
	const now = new Date()

	if (status === "UP") {
		await statsRepository.incrementStat(cronJobId, now, "upMinutes")
	} else if (status === "DOWN" || status === "LATE") {
		await statsRepository.incrementStat(cronJobId, now, "downMinutes")
	}
	// NEW and PAUSED don't count towards uptime
}

export async function recordPing(cronJobId: string): Promise<void> {
	const now = new Date()
	await statsRepository.incrementStat(cronJobId, now, "totalPings")
}

export async function recordHttpMonitorStatus(
	httpMonitorId: string,
	status: string,
): Promise<void> {
	const now = new Date()

	if (status === "UP") {
		await statsRepository.incrementHttpMonitorStat(
			httpMonitorId,
			now,
			"upMinutes",
		)
	} else if (status === "DOWN" || status === "LATE") {
		await statsRepository.incrementHttpMonitorStat(
			httpMonitorId,
			now,
			"downMinutes",
		)
	}
}

function httpStatToUptimeDay(stat: HttpMonitorDailyStatModel): UptimeDay {
	return {
		date: formatDate(stat.date),
		upPercent: Math.round(stat.upPercent * 100) / 100,
		upMinutes: stat.upMinutes,
		downMinutes: stat.downMinutes,
		totalPings: stat.totalPolls,
	}
}

function fillMissingDaysHttp(
	stats: HttpMonitorDailyStatModel[],
	startDate: Date,
	endDate: Date,
): UptimeDay[] {
	const result: UptimeDay[] = []
	const statsByDate = new Map<string, HttpMonitorDailyStatModel>()

	for (const stat of stats) {
		statsByDate.set(formatDate(stat.date), stat)
	}

	const current = new Date(startDate)
	while (current <= endDate) {
		const dateStr = formatDate(current)
		const stat = statsByDate.get(dateStr)

		if (stat) {
			result.push(httpStatToUptimeDay(stat))
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

export async function getHttpMonitorsUptimeHistory(
	httpMonitorIds: string[],
	days: number,
): Promise<Map<string, UptimeDay[]>> {
	const { startDate, endDate } = getDateRange(days)

	const stats = await statsRepository.findHttpMonitorStatsByIdsAndDateRange(
		httpMonitorIds,
		startDate,
		endDate,
	)

	const statsByHttpMonitor = new Map<string, HttpMonitorDailyStatModel[]>()
	for (const stat of stats) {
		const existing = statsByHttpMonitor.get(stat.httpMonitorId) ?? []
		existing.push(stat)
		statsByHttpMonitor.set(stat.httpMonitorId, existing)
	}

	const result = new Map<string, UptimeDay[]>()
	for (const httpMonitorId of httpMonitorIds) {
		const httpStats = statsByHttpMonitor.get(httpMonitorId) ?? []
		result.set(
			httpMonitorId,
			fillMissingDaysHttp(httpStats, startDate, endDate),
		)
	}

	return result
}
