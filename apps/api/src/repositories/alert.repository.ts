import { Prisma, prisma } from "@haspulse/db"
import type { AlertContext } from "../routes/v1/alerts/alerts.schemas.js"

export type AlertModel = {
	id: string
	checkId: string
	event: string
	channels: Array<{ id: string; name: string; type: string }>
	context: AlertContext | null
	success: boolean
	error: string | null
	createdAt: Date
}

export type AlertModelWithCheck = AlertModel & {
	checkName: string
	projectId: string
	projectName: string
}

export type AlertFilters = {
	event?: string
	fromDate?: Date
	toDate?: Date
}

export type AlertOrgFilters = AlertFilters & {
	projectId?: string
	checkId?: string
}

type CreateAlertInput = {
	checkId: string
	event: string
	channels: Array<{ id: string; name: string; type: string }>
	context?: AlertContext | null
	success: boolean
	error?: string | null
}

type AlertRow = {
	id: string
	checkId: string
	event: string
	channels: unknown
	context: unknown
	success: boolean
	error: string | null
	createdAt: Date
}

type AlertRowWithCheck = AlertRow & {
	check: {
		name: string
		projectId: string
		project: {
			name: string
		}
	}
}

function toAlertModel(alert: AlertRow): AlertModel {
	return {
		id: alert.id,
		checkId: alert.checkId,
		event: alert.event,
		channels: alert.channels as Array<{
			id: string
			name: string
			type: string
		}>,
		context: alert.context as AlertContext | null,
		success: alert.success,
		error: alert.error,
		createdAt: alert.createdAt,
	}
}

function toAlertModelWithCheck(alert: AlertRowWithCheck): AlertModelWithCheck {
	return {
		...toAlertModel(alert),
		checkName: alert.check.name,
		projectId: alert.check.projectId,
		projectName: alert.check.project.name,
	}
}

function buildDateFilter(
	filters?: AlertFilters,
): { gte?: Date; lte?: Date } | undefined {
	if (!filters?.fromDate && !filters?.toDate) return undefined
	return {
		...(filters.fromDate && { gte: filters.fromDate }),
		...(filters.toDate && { lte: filters.toDate }),
	}
}

export const alertRepository = {
	async create(input: CreateAlertInput): Promise<AlertModel> {
		const alert = await prisma.alert.create({
			data: {
				checkId: input.checkId,
				event: input.event,
				channels: input.channels as unknown as Prisma.InputJsonValue,
				context: input.context
					? (input.context as unknown as Prisma.InputJsonValue)
					: Prisma.JsonNull,
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

	async findByCheckIdPaginated(
		checkId: string,
		page: number,
		limit: number,
		filters?: AlertFilters,
	): Promise<{ data: AlertModel[]; total: number }> {
		const dateFilter = buildDateFilter(filters)
		const where: Prisma.AlertWhereInput = {
			checkId,
			...(filters?.event && { event: filters.event }),
			...(dateFilter && { createdAt: dateFilter }),
		}

		const [alerts, total] = await Promise.all([
			prisma.alert.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.alert.count({ where }),
		])

		return {
			data: alerts.map(toAlertModel),
			total,
		}
	},

	async findByOrgIdPaginated(
		orgId: string,
		page: number,
		limit: number,
		filters?: AlertOrgFilters,
	): Promise<{ data: AlertModelWithCheck[]; total: number }> {
		const dateFilter = buildDateFilter(filters)
		const where: Prisma.AlertWhereInput = {
			check: {
				project: {
					orgId,
					...(filters?.projectId && { id: filters.projectId }),
				},
				...(filters?.checkId && { id: filters.checkId }),
			},
			...(filters?.event && { event: filters.event }),
			...(dateFilter && { createdAt: dateFilter }),
		}

		const [alerts, total] = await Promise.all([
			prisma.alert.findMany({
				where,
				include: {
					check: {
						select: {
							name: true,
							projectId: true,
							project: {
								select: { name: true },
							},
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.alert.count({ where }),
		])

		return {
			data: alerts.map(toAlertModelWithCheck),
			total,
		}
	},
}
