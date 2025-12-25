import { prisma } from "@haspulse/db"

export type DailyStatModel = {
	id: string
	checkId: string
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
	checkId: string
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
		checkId: stat.checkId,
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
		checkId: string,
		date: Date,
		data: {
			upMinutes?: number
			downMinutes?: number
			totalPings?: number
		},
	): Promise<DailyStatModel> {
		const dateOnly = new Date(date.toISOString().slice(0, 10))

		const stat = await prisma.checkDailyStat.upsert({
			where: {
				checkId_date: { checkId, date: dateOnly },
			},
			create: {
				checkId,
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
		checkId: string,
		date: Date,
		field: "upMinutes" | "downMinutes" | "totalPings",
	): Promise<DailyStatModel> {
		const dateOnly = new Date(date.toISOString().slice(0, 10))

		const stat = await prisma.checkDailyStat.upsert({
			where: {
				checkId_date: { checkId, date: dateOnly },
			},
			create: {
				checkId,
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
			const updated = await prisma.checkDailyStat.update({
				where: { id: stat.id },
				data: { upPercent },
			})
			return toDailyStatModel(updated)
		}

		return toDailyStatModel(stat)
	},

	async findByCheckIdAndDateRange(
		checkId: string,
		startDate: Date,
		endDate: Date,
	): Promise<DailyStatModel[]> {
		const stats = await prisma.checkDailyStat.findMany({
			where: {
				checkId,
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
		const stats = await prisma.checkDailyStat.findMany({
			where: {
				check: { projectId },
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: { date: "asc" },
		})

		return stats.map(toDailyStatModel)
	},

	async findByCheckIdsAndDateRange(
		checkIds: string[],
		startDate: Date,
		endDate: Date,
	): Promise<DailyStatModel[]> {
		const stats = await prisma.checkDailyStat.findMany({
			where: {
				checkId: { in: checkIds },
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: { date: "asc" },
		})

		return stats.map(toDailyStatModel)
	},
}
