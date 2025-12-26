import { prisma } from "@haspulse/db"

export type DurationStatModel = {
	id: string
	checkId: string
	windowStart: Date
	windowEnd: Date
	sampleCount: number
	avgDurationMs: number | null
	p50DurationMs: number | null
	p95DurationMs: number | null
	p99DurationMs: number | null
	stdDevMs: number | null
	minDurationMs: number | null
	maxDurationMs: number | null
	createdAt: Date
	updatedAt: Date
}

type UpsertDurationStatInput = {
	windowStart: Date
	windowEnd: Date
	sampleCount: number
	avgDurationMs: number | null
	p50DurationMs: number | null
	p95DurationMs: number | null
	p99DurationMs: number | null
	stdDevMs: number | null
	minDurationMs: number | null
	maxDurationMs: number | null
}

function toModel(stat: {
	id: string
	checkId: string
	windowStart: Date
	windowEnd: Date
	sampleCount: number
	avgDurationMs: number | null
	p50DurationMs: number | null
	p95DurationMs: number | null
	p99DurationMs: number | null
	stdDevMs: number | null
	minDurationMs: number | null
	maxDurationMs: number | null
	createdAt: Date
	updatedAt: Date
}): DurationStatModel {
	return {
		id: stat.id,
		checkId: stat.checkId,
		windowStart: stat.windowStart,
		windowEnd: stat.windowEnd,
		sampleCount: stat.sampleCount,
		avgDurationMs: stat.avgDurationMs,
		p50DurationMs: stat.p50DurationMs,
		p95DurationMs: stat.p95DurationMs,
		p99DurationMs: stat.p99DurationMs,
		stdDevMs: stat.stdDevMs,
		minDurationMs: stat.minDurationMs,
		maxDurationMs: stat.maxDurationMs,
		createdAt: stat.createdAt,
		updatedAt: stat.updatedAt,
	}
}

export const durationStatRepository = {
	async findLatestByCheckId(
		checkId: string,
	): Promise<DurationStatModel | null> {
		const stat = await prisma.checkDurationStat.findFirst({
			where: { checkId },
			orderBy: { windowEnd: "desc" },
		})
		return stat ? toModel(stat) : null
	},

	async findByCheckIdAndWindow(
		checkId: string,
		windowStart: Date,
	): Promise<DurationStatModel | null> {
		const stat = await prisma.checkDurationStat.findUnique({
			where: {
				checkId_windowStart: { checkId, windowStart },
			},
		})
		return stat ? toModel(stat) : null
	},

	async upsert(
		checkId: string,
		data: UpsertDurationStatInput,
	): Promise<DurationStatModel> {
		const stat = await prisma.checkDurationStat.upsert({
			where: {
				checkId_windowStart: { checkId, windowStart: data.windowStart },
			},
			create: {
				checkId,
				windowStart: data.windowStart,
				windowEnd: data.windowEnd,
				sampleCount: data.sampleCount,
				avgDurationMs: data.avgDurationMs,
				p50DurationMs: data.p50DurationMs,
				p95DurationMs: data.p95DurationMs,
				p99DurationMs: data.p99DurationMs,
				stdDevMs: data.stdDevMs,
				minDurationMs: data.minDurationMs,
				maxDurationMs: data.maxDurationMs,
			},
			update: {
				windowEnd: data.windowEnd,
				sampleCount: data.sampleCount,
				avgDurationMs: data.avgDurationMs,
				p50DurationMs: data.p50DurationMs,
				p95DurationMs: data.p95DurationMs,
				p99DurationMs: data.p99DurationMs,
				stdDevMs: data.stdDevMs,
				minDurationMs: data.minDurationMs,
				maxDurationMs: data.maxDurationMs,
			},
		})
		return toModel(stat)
	},

	async findRecentByCheckId(
		checkId: string,
		limit: number,
	): Promise<DurationStatModel[]> {
		const stats = await prisma.checkDurationStat.findMany({
			where: { checkId },
			orderBy: { windowEnd: "desc" },
			take: limit,
		})
		return stats.map(toModel)
	},

	async deleteOlderThan(checkId: string, cutoffDate: Date): Promise<number> {
		const result = await prisma.checkDurationStat.deleteMany({
			where: {
				checkId,
				windowEnd: { lt: cutoffDate },
			},
		})
		return result.count
	},
}
