import { type Prisma, prisma } from "@haspulse/db"

export type AlertModel = {
	id: string
	checkId: string
	event: string
	channels: Array<{ id: string; name: string; type: string }>
	success: boolean
	error: string | null
	createdAt: Date
}

type CreateAlertInput = {
	checkId: string
	event: string
	channels: Array<{ id: string; name: string; type: string }>
	success: boolean
	error?: string | null
}

function toAlertModel(alert: {
	id: string
	checkId: string
	event: string
	channels: unknown
	success: boolean
	error: string | null
	createdAt: Date
}): AlertModel {
	return {
		id: alert.id,
		checkId: alert.checkId,
		event: alert.event,
		channels: alert.channels as Array<{
			id: string
			name: string
			type: string
		}>,
		success: alert.success,
		error: alert.error,
		createdAt: alert.createdAt,
	}
}

export const alertRepository = {
	async create(input: CreateAlertInput): Promise<AlertModel> {
		const alert = await prisma.alert.create({
			data: {
				checkId: input.checkId,
				event: input.event,
				channels: input.channels as unknown as Prisma.InputJsonValue,
				success: input.success,
				error: input.error,
			},
		})
		return toAlertModel(alert)
	},

	async findByCheckId(checkId: string, limit = 50): Promise<AlertModel[]> {
		const alerts = await prisma.alert.findMany({
			where: { checkId },
			orderBy: { createdAt: "desc" },
			take: limit,
		})
		return alerts.map(toAlertModel)
	},
}
