import { type PingType, prisma } from "@haspulse/db"
import type { PingModel } from "../services/ping.service.js"

type CreatePingData = {
	cronJobId: string
	type: PingType
	body: string | null
	sourceIp: string
	durationMs?: number | null
	startPingId?: string | null
}

function toModel(ping: {
	id: string
	cronJobId: string
	type: PingType
	body: string | null
	sourceIp: string
	durationMs: number | null
	startPingId: string | null
	createdAt: Date
}): PingModel {
	return {
		id: ping.id,
		cronJobId: ping.cronJobId,
		type: ping.type,
		body: ping.body,
		sourceIp: ping.sourceIp,
		durationMs: ping.durationMs,
		startPingId: ping.startPingId,
		createdAt: ping.createdAt,
	}
}

export const pingRepository = {
	async create(data: CreatePingData): Promise<PingModel> {
		const ping = await prisma.ping.create({
			data: {
				cronJobId: data.cronJobId,
				type: data.type,
				body: data.body,
				sourceIp: data.sourceIp,
				durationMs: data.durationMs ?? null,
				startPingId: data.startPingId ?? null,
			},
		})
		return toModel(ping)
	},

	async findByCronJobId(cronJobId: string, limit = 50): Promise<PingModel[]> {
		const pings = await prisma.ping.findMany({
			where: { cronJobId },
			orderBy: { createdAt: "desc" },
			take: limit,
		})
		return pings.map(toModel)
	},

	async findByCronJobIdPaginated(
		cronJobId: string,
		page: number,
		limit: number,
	): Promise<{ data: PingModel[]; total: number }> {
		const [pings, total] = await Promise.all([
			prisma.ping.findMany({
				where: { cronJobId },
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.ping.count({ where: { cronJobId } }),
		])
		return { data: pings.map(toModel), total }
	},

	async deleteOlderThan(cronJobId: string, cutoffDate: Date): Promise<number> {
		const result = await prisma.ping.deleteMany({
			where: {
				cronJobId,
				createdAt: { lt: cutoffDate },
			},
		})
		return result.count
	},

	async deleteExcessPings(
		cronJobId: string,
		keepCount: number,
	): Promise<number> {
		const pings = await prisma.ping.findMany({
			where: { cronJobId },
			orderBy: { createdAt: "desc" },
			skip: keepCount,
			take: 1,
			select: { createdAt: true },
		})

		const cutoff = pings[0]?.createdAt
		if (!cutoff) return 0

		const result = await prisma.ping.deleteMany({
			where: {
				cronJobId,
				createdAt: { lte: cutoff },
			},
		})
		return result.count
	},

	async findRecentByCronJobIds(
		cronJobIds: string[],
		limit = 5,
	): Promise<Map<string, { type: PingType; createdAt: Date }[]>> {
		if (cronJobIds.length === 0) return new Map()

		const pings = await prisma.ping.findMany({
			where: { cronJobId: { in: cronJobIds } },
			orderBy: { createdAt: "desc" },
			select: { cronJobId: true, type: true, createdAt: true },
		})

		const result = new Map<string, { type: PingType; createdAt: Date }[]>()
		for (const cronJobId of cronJobIds) {
			result.set(cronJobId, [])
		}

		for (const ping of pings) {
			const arr = result.get(ping.cronJobId)
			if (arr && arr.length < limit) {
				arr.push({ type: ping.type, createdAt: ping.createdAt })
			}
		}

		return result
	},

	async findLatestStartPing(cronJobId: string): Promise<PingModel | null> {
		const ping = await prisma.ping.findFirst({
			where: { cronJobId, type: "START" },
			orderBy: { createdAt: "desc" },
		})
		return ping ? toModel(ping) : null
	},

	async findRecentWithDuration(
		cronJobId: string,
		limit: number,
	): Promise<PingModel[]> {
		const pings = await prisma.ping.findMany({
			where: {
				cronJobId,
				durationMs: { not: null },
			},
			orderBy: { createdAt: "desc" },
			take: limit,
		})
		return pings.map(toModel)
	},

	async findFailedInTimeWindow(
		cronJobIds: string[],
		windowStart: Date,
		windowEnd: Date,
	): Promise<
		Array<{ cronJobId: string; cronJobName: string; createdAt: Date }>
	> {
		if (cronJobIds.length === 0) return []

		const pings = await prisma.ping.findMany({
			where: {
				cronJobId: { in: cronJobIds },
				type: "FAIL",
				createdAt: {
					gte: windowStart,
					lte: windowEnd,
				},
			},
			include: {
				cronJob: { select: { name: true } },
			},
			orderBy: { createdAt: "desc" },
		})

		return pings.map((p) => ({
			cronJobId: p.cronJobId,
			cronJobName: p.cronJob.name,
			createdAt: p.createdAt,
		}))
	},

	async countFailedByCronJobId(
		cronJobId: string,
		since: Date,
	): Promise<number> {
		return prisma.ping.count({
			where: {
				cronJobId,
				type: "FAIL",
				createdAt: { gte: since },
			},
		})
	},

	async findAllDurationsInWindow(
		cronJobId: string,
		windowStart: Date,
		windowEnd: Date,
	): Promise<number[]> {
		const pings = await prisma.ping.findMany({
			where: {
				cronJobId,
				durationMs: { not: null },
				createdAt: {
					gte: windowStart,
					lte: windowEnd,
				},
			},
			select: { durationMs: true },
			orderBy: { createdAt: "asc" },
		})
		return pings.map((p) => p.durationMs).filter((d): d is number => d !== null)
	},
}
