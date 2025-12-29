import { prisma } from "@haspulse/db"

export type DailyStatModel = {
	id: string
	cronJobId: string
	date: Date
	upMinutes: number
	downMinutes: number
	totalPings: number
	upPercent: number
	createdAt: Date
	updatedAt: Date
}

function toDailyStatModel(stat: {
	id: string
	cronJobId: string
	date: Date
	upMinutes: number
	downMinutes: number
	totalPings: number
	upPercent: number
	createdAt: Date
	updatedAt: Date
}): DailyStatModel {
	return {
		id: stat.id,
		cronJobId: stat.cronJobId,
		date: stat.date,
		upMinutes: stat.upMinutes,
		downMinutes: stat.downMinutes,
		totalPings: stat.totalPings,
		upPercent: stat.upPercent,
		createdAt: stat.createdAt,
		updatedAt: stat.updatedAt,
	}
}

export const statsRepository = {
	async upsertDailyStat(
		cronJobId: string,
		date: Date,
		data: {
			upMinutes?: number
			downMinutes?: number
			totalPings?: number
		},
	): Promise<DailyStatModel> {
		const dateOnly = new Date(date.toISOString().slice(0, 10))

		const stat = await prisma.cronJobDailyStat.upsert({
			where: {
				cronJobId_date: { cronJobId, date: dateOnly },
			},
			create: {
				cronJobId,
				date: dateOnly,
				upMinutes: data.upMinutes ?? 0,
				downMinutes: data.downMinutes ?? 0,
				totalPings: data.totalPings ?? 0,
				upPercent: 0,
			},
			update: {
				upMinutes: data.upMinutes,
				downMinutes: data.downMinutes,
				totalPings: data.totalPings,
			},
		})

		return toDailyStatModel(stat)
	},

	async incrementStat(
		cronJobId: string,
		date: Date,
		field: "upMinutes" | "downMinutes" | "totalPings",
	): Promise<DailyStatModel> {
		const dateOnly = new Date(date.toISOString().slice(0, 10))

		const stat = await prisma.cronJobDailyStat.upsert({
			where: {
				cronJobId_date: { cronJobId, date: dateOnly },
			},
			create: {
				cronJobId,
				date: dateOnly,
				[field]: 1,
				upPercent: field === "upMinutes" ? 100 : 0,
			},
			update: {
				[field]: { increment: 1 },
			},
		})

		// Recalculate upPercent
		const total = stat.upMinutes + stat.downMinutes
		const upPercent = total > 0 ? (stat.upMinutes / total) * 100 : 0

		if (Math.abs(upPercent - stat.upPercent) > 0.01) {
			const updated = await prisma.cronJobDailyStat.update({
				where: { id: stat.id },
				data: { upPercent },
			})
			return toDailyStatModel(updated)
		}

		return toDailyStatModel(stat)
	},

	async findByCronJobIdAndDateRange(
		cronJobId: string,
		startDate: Date,
		endDate: Date,
	): Promise<DailyStatModel[]> {
		const stats = await prisma.cronJobDailyStat.findMany({
			where: {
				cronJobId,
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: { date: "asc" },
		})

		return stats.map(toDailyStatModel)
	},

	async findByProjectIdAndDateRange(
		projectId: string,
		startDate: Date,
		endDate: Date,
	): Promise<DailyStatModel[]> {
		const stats = await prisma.cronJobDailyStat.findMany({
			where: {
				cronJob: { projectId },
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: { date: "asc" },
		})

		return stats.map(toDailyStatModel)
	},

	async findByCronJobIdsAndDateRange(
		cronJobIds: string[],
		startDate: Date,
		endDate: Date,
	): Promise<DailyStatModel[]> {
		const stats = await prisma.cronJobDailyStat.findMany({
			where: {
				cronJobId: { in: cronJobIds },
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: { date: "asc" },
		})

		return stats.map(toDailyStatModel)
	},

	async getOrgUptimeForPeriod(
		orgId: string,
		days: number,
	): Promise<{ upMinutes: number; downMinutes: number }> {
		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)
		startDate.setHours(0, 0, 0, 0)

		const result = await prisma.cronJobDailyStat.aggregate({
			where: {
				cronJob: { project: { orgId } },
				date: { gte: startDate },
			},
			_sum: {
				upMinutes: true,
				downMinutes: true,
			},
		})

		return {
			upMinutes: result._sum.upMinutes ?? 0,
			downMinutes: result._sum.downMinutes ?? 0,
		}
	},

	// HTTP Monitor Stats
	async incrementHttpMonitorStat(
		httpMonitorId: string,
		date: Date,
		field: "upMinutes" | "downMinutes" | "totalPolls",
	): Promise<void> {
		const dateOnly = new Date(date.toISOString().slice(0, 10))

		const stat = await prisma.httpMonitorDailyStat.upsert({
			where: {
				httpMonitorId_date: { httpMonitorId, date: dateOnly },
			},
			create: {
				httpMonitorId,
				date: dateOnly,
				[field]: 1,
				upPercent: field === "upMinutes" ? 100 : 0,
			},
			update: {
				[field]: { increment: 1 },
			},
		})

		// Recalculate upPercent
		const total = stat.upMinutes + stat.downMinutes
		const upPercent = total > 0 ? (stat.upMinutes / total) * 100 : 0

		if (Math.abs(upPercent - stat.upPercent) > 0.01) {
			await prisma.httpMonitorDailyStat.update({
				where: { id: stat.id },
				data: { upPercent },
			})
		}
	},

	async findHttpMonitorStatsByIdsAndDateRange(
		httpMonitorIds: string[],
		startDate: Date,
		endDate: Date,
	): Promise<HttpMonitorDailyStatModel[]> {
		const stats = await prisma.httpMonitorDailyStat.findMany({
			where: {
				httpMonitorId: { in: httpMonitorIds },
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: { date: "asc" },
		})

		return stats.map(toHttpMonitorDailyStatModel)
	},
}

export type HttpMonitorDailyStatModel = {
	id: string
	httpMonitorId: string
	date: Date
	upMinutes: number
	downMinutes: number
	totalPolls: number
	upPercent: number
}

function toHttpMonitorDailyStatModel(stat: {
	id: string
	httpMonitorId: string
	date: Date
	upMinutes: number
	downMinutes: number
	totalPolls: number
	upPercent: number
}): HttpMonitorDailyStatModel {
	return {
		id: stat.id,
		httpMonitorId: stat.httpMonitorId,
		date: stat.date,
		upMinutes: stat.upMinutes,
		downMinutes: stat.downMinutes,
		totalPolls: stat.totalPolls,
		upPercent: stat.upPercent,
	}
}
