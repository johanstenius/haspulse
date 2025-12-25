import { type PingType, prisma } from "@haspulse/db"
import type { PingModel } from "../services/ping.service.js"

type CreatePingData = {
	checkId: string
	type: PingType
	body: string | null
	sourceIp: string
}

export const pingRepository = {
	async create(data: CreatePingData): Promise<PingModel> {
		const ping = await prisma.ping.create({
			data: {
				checkId: data.checkId,
				type: data.type,
				body: data.body,
				sourceIp: data.sourceIp,
			},
		})
		return {
			id: ping.id,
			checkId: ping.checkId,
			type: ping.type,
			body: ping.body,
			sourceIp: ping.sourceIp,
			createdAt: ping.createdAt,
		}
	},

	async findByCheckId(checkId: string, limit = 50): Promise<PingModel[]> {
		const pings = await prisma.ping.findMany({
			where: { checkId },
			orderBy: { createdAt: "desc" },
			take: limit,
		})
		return pings.map((ping) => ({
			id: ping.id,
			checkId: ping.checkId,
			type: ping.type,
			body: ping.body,
			sourceIp: ping.sourceIp,
			createdAt: ping.createdAt,
		}))
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
}
