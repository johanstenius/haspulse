import { type PingType, prisma } from "@haspulse/db"
import type { PingModel } from "../services/ping.service.js"

type CreatePingData = {
	checkId: string
	type: PingType
	body: string | null
	sourceIp: string
	durationMs?: number | null
	startPingId?: string | null
}

function toModel(ping: {
	id: string
	checkId: string
	type: PingType
	body: string | null
	sourceIp: string
	durationMs: number | null
	startPingId: string | null
	createdAt: Date
}): PingModel {
	return {
		id: ping.id,
		checkId: ping.checkId,
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
				checkId: data.checkId,
				type: data.type,
				body: data.body,
				sourceIp: data.sourceIp,
				durationMs: data.durationMs ?? null,
				startPingId: data.startPingId ?? null,
			},
		})
		return toModel(ping)
	},

	async findByCheckId(checkId: string, limit = 50): Promise<PingModel[]> {
		const pings = await prisma.ping.findMany({
			where: { checkId },
			orderBy: { createdAt: "desc" },
			take: limit,
		})
		return pings.map(toModel)
	},

	async deleteOlderThan(checkId: string, cutoffDate: Date): Promise<number> {
		const result = await prisma.ping.deleteMany({
			where: {
				checkId,
				createdAt: { lt: cutoffDate },
			},
		})
		return result.count
	},

	async deleteExcessPings(checkId: string, keepCount: number): Promise<number> {
		// Find the Nth newest ping's createdAt as cutoff
		const pings = await prisma.ping.findMany({
			where: { checkId },
			orderBy: { createdAt: "desc" },
			skip: keepCount,
			take: 1,
			select: { createdAt: true },
		})

		const cutoff = pings[0]?.createdAt
		if (!cutoff) return 0

		const result = await prisma.ping.deleteMany({
			where: {
				checkId,
				createdAt: { lte: cutoff },
			},
		})
		return result.count
	},

	async findRecentByCheckIds(
		checkIds: string[],
		limit = 5,
	): Promise<Map<string, { type: PingType; createdAt: Date }[]>> {
		if (checkIds.length === 0) return new Map()

		// Fetch recent pings for all checks at once
		const pings = await prisma.ping.findMany({
			where: { checkId: { in: checkIds } },
			orderBy: { createdAt: "desc" },
			select: { checkId: true, type: true, createdAt: true },
		})

		// Group by checkId and limit to N per check
		const result = new Map<string, { type: PingType; createdAt: Date }[]>()
		for (const checkId of checkIds) {
			result.set(checkId, [])
		}

		for (const ping of pings) {
			const arr = result.get(ping.checkId)
			if (arr && arr.length < limit) {
				arr.push({ type: ping.type, createdAt: ping.createdAt })
			}
		}

		return result
	},

	async findLatestStartPing(checkId: string): Promise<PingModel | null> {
		const ping = await prisma.ping.findFirst({
			where: { checkId, type: "START" },
			orderBy: { createdAt: "desc" },
		})
		return ping ? toModel(ping) : null
	},

	async findRecentWithDuration(
		checkId: string,
		limit: number,
	): Promise<PingModel[]> {
		const pings = await prisma.ping.findMany({
			where: {
				checkId,
				durationMs: { not: null },
			},
			orderBy: { createdAt: "desc" },
			take: limit,
		})
		return pings.map(toModel)
	},

	async findFailedInTimeWindow(
		checkIds: string[],
		windowStart: Date,
		windowEnd: Date,
	): Promise<Array<{ checkId: string; checkName: string; createdAt: Date }>> {
		if (checkIds.length === 0) return []

		const pings = await prisma.ping.findMany({
			where: {
				checkId: { in: checkIds },
				type: "FAIL",
				createdAt: {
					gte: windowStart,
					lte: windowEnd,
				},
			},
			include: {
				check: { select: { name: true } },
			},
			orderBy: { createdAt: "desc" },
		})

		return pings.map((p) => ({
			checkId: p.checkId,
			checkName: p.check.name,
			createdAt: p.createdAt,
		}))
	},

	async countFailedByCheckId(checkId: string, since: Date): Promise<number> {
		return prisma.ping.count({
			where: {
				checkId,
				type: "FAIL",
				createdAt: { gte: since },
			},
		})
	},

	async findAllDurationsInWindow(
		checkId: string,
		windowStart: Date,
		windowEnd: Date,
	): Promise<number[]> {
		const pings = await prisma.ping.findMany({
			where: {
				checkId,
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
