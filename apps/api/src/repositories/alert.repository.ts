import { Prisma, prisma } from "@haspulse/db"
import type { AlertContext } from "../routes/v1/alerts/alerts.schemas.js"

export type AlertModel = {
	id: string
	cronJobId: string
	event: string
	channels: Array<{ id: string; name: string; type: string }>
	context: AlertContext | null
	success: boolean
	error: string | null
	createdAt: Date
}

export type AlertModelWithCronJob = AlertModel & {
	cronJobName: string
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
	cronJobId?: string
}

type CreateAlertInput = {
	cronJobId: string
	event: string
	channels: Array<{ id: string; name: string; type: string }>
	context?: AlertContext | null
	success: boolean
	error?: string | null
}

type AlertRow = {
	id: string
	cronJobId: string
	event: string
	channels: unknown
	context: unknown
	success: boolean
	error: string | null
	createdAt: Date
}

type AlertRowWithCronJob = AlertRow & {
	cronJob: {
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
		cronJobId: alert.cronJobId,
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

function toAlertModelWithCronJob(
	alert: AlertRowWithCronJob,
): AlertModelWithCronJob {
	return {
		...toAlertModel(alert),
		cronJobName: alert.cronJob.name,
		projectId: alert.cronJob.projectId,
		projectName: alert.cronJob.project.name,
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
	async hasRecentAlert(
		cronJobId: string,
		event: string,
		withinMinutes: number,
	): Promise<boolean> {
		const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
		const count = await prisma.alert.count({
			where: {
				cronJobId,
				event,
				createdAt: { gte: cutoff },
			},
		})
		return count > 0
	},

	async create(input: CreateAlertInput): Promise<AlertModel> {
		const alert = await prisma.alert.create({
			data: {
				cronJobId: input.cronJobId,
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

	async findByCronJobId(cronJobId: string, limit = 50): Promise<AlertModel[]> {
		const alerts = await prisma.alert.findMany({
			where: { cronJobId },
			orderBy: { createdAt: "desc" },
			take: limit,
		})
		return alerts.map(toAlertModel)
	},

	async findByCronJobIdPaginated(
		cronJobId: string,
		page: number,
		limit: number,
		filters?: AlertFilters,
	): Promise<{ data: AlertModel[]; total: number }> {
		const dateFilter = buildDateFilter(filters)
		const where: Prisma.AlertWhereInput = {
			cronJobId,
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
	): Promise<{ data: AlertModelWithCronJob[]; total: number }> {
		const dateFilter = buildDateFilter(filters)
		const where: Prisma.AlertWhereInput = {
			cronJob: {
				project: {
					orgId,
					...(filters?.projectId && { id: filters.projectId }),
				},
				...(filters?.cronJobId && { id: filters.cronJobId }),
			},
			...(filters?.event && { event: filters.event }),
			...(dateFilter && { createdAt: dateFilter }),
		}

		const [alerts, total] = await Promise.all([
			prisma.alert.findMany({
				where,
				include: {
					cronJob: {
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
			data: alerts.map(toAlertModelWithCronJob),
			total,
		}
	},
}
