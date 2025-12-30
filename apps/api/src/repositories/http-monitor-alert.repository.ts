import { Prisma, prisma } from "@haspulse/db"

export type HttpMonitorAlertModel = {
	id: string
	httpMonitorId: string
	event: string
	channels: Array<{ id: string; name: string; type: string }>
	context: Record<string, unknown> | null
	success: boolean
	error: string | null
	createdAt: Date
}

export type HttpMonitorAlertModelWithMonitor = HttpMonitorAlertModel & {
	httpMonitorName: string
	projectId: string
	projectName: string
}

export type HttpMonitorAlertFilters = {
	event?: string
	fromDate?: Date
	toDate?: Date
}

type CreateHttpMonitorAlertInput = {
	httpMonitorId: string
	event: string
	channels: Array<{ id: string; name: string; type: string }>
	context?: Record<string, unknown> | null
	success: boolean
	error?: string | null
}

type AlertRow = {
	id: string
	httpMonitorId: string
	event: string
	channels: unknown
	context: unknown
	success: boolean
	error: string | null
	createdAt: Date
}

type AlertRowWithMonitor = AlertRow & {
	httpMonitor: {
		name: string
		projectId: string
		project: {
			name: string
		}
	}
}

function toAlertModel(alert: AlertRow): HttpMonitorAlertModel {
	return {
		id: alert.id,
		httpMonitorId: alert.httpMonitorId,
		event: alert.event,
		channels: alert.channels as Array<{
			id: string
			name: string
			type: string
		}>,
		context: alert.context as Record<string, unknown> | null,
		success: alert.success,
		error: alert.error,
		createdAt: alert.createdAt,
	}
}

function toAlertModelWithMonitor(
	alert: AlertRowWithMonitor,
): HttpMonitorAlertModelWithMonitor {
	return {
		...toAlertModel(alert),
		httpMonitorName: alert.httpMonitor.name,
		projectId: alert.httpMonitor.projectId,
		projectName: alert.httpMonitor.project.name,
	}
}

function buildDateFilter(
	filters?: HttpMonitorAlertFilters,
): { gte?: Date; lte?: Date } | undefined {
	if (!filters?.fromDate && !filters?.toDate) return undefined
	return {
		...(filters.fromDate && { gte: filters.fromDate }),
		...(filters.toDate && { lte: filters.toDate }),
	}
}

export const httpMonitorAlertRepository = {
	async hasRecentAlert(
		httpMonitorId: string,
		event: string,
		withinMinutes: number,
	): Promise<boolean> {
		const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
		const count = await prisma.httpMonitorAlert.count({
			where: {
				httpMonitorId,
				event,
				createdAt: { gte: cutoff },
			},
		})
		return count > 0
	},

	async create(
		input: CreateHttpMonitorAlertInput,
	): Promise<HttpMonitorAlertModel> {
		const alert = await prisma.httpMonitorAlert.create({
			data: {
				httpMonitorId: input.httpMonitorId,
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

	async findByHttpMonitorIdPaginated(
		httpMonitorId: string,
		page: number,
		limit: number,
		filters?: HttpMonitorAlertFilters,
	): Promise<{ data: HttpMonitorAlertModel[]; total: number }> {
		const dateFilter = buildDateFilter(filters)
		const where: Prisma.HttpMonitorAlertWhereInput = {
			httpMonitorId,
			...(filters?.event && { event: filters.event }),
			...(dateFilter && { createdAt: dateFilter }),
		}

		const [alerts, total] = await Promise.all([
			prisma.httpMonitorAlert.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.httpMonitorAlert.count({ where }),
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
		filters?: HttpMonitorAlertFilters & {
			projectId?: string
			httpMonitorId?: string
		},
	): Promise<{ data: HttpMonitorAlertModelWithMonitor[]; total: number }> {
		const dateFilter = buildDateFilter(filters)
		const where: Prisma.HttpMonitorAlertWhereInput = {
			httpMonitor: {
				project: {
					orgId,
					...(filters?.projectId && { id: filters.projectId }),
				},
				...(filters?.httpMonitorId && { id: filters.httpMonitorId }),
			},
			...(filters?.event && { event: filters.event }),
			...(dateFilter && { createdAt: dateFilter }),
		}

		const [alerts, total] = await Promise.all([
			prisma.httpMonitorAlert.findMany({
				where,
				include: {
					httpMonitor: {
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
			prisma.httpMonitorAlert.count({ where }),
		])

		return {
			data: alerts.map(toAlertModelWithMonitor),
			total,
		}
	},
}
