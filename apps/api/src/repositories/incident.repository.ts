import { prisma } from "@haspulse/db"

export type IncidentStatus =
	| "INVESTIGATING"
	| "IDENTIFIED"
	| "MONITORING"
	| "RESOLVED"

export type IncidentSeverity = "MINOR" | "MAJOR" | "CRITICAL"

export type IncidentModel = {
	id: string
	statusPageId: string
	title: string
	status: IncidentStatus
	severity: IncidentSeverity
	componentIds: string[]
	autoCreated: boolean
	sourceCronJobId: string | null
	sourceHttpMonitorId: string | null
	startsAt: Date
	resolvedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

export type IncidentUpdateModel = {
	id: string
	incidentId: string
	status: IncidentStatus
	message: string
	createdAt: Date
}

export type IncidentWithUpdates = IncidentModel & {
	updates: IncidentUpdateModel[]
}

type CreateIncidentData = {
	statusPageId: string
	title: string
	status?: IncidentStatus
	severity: IncidentSeverity
	componentIds: string[]
	autoCreated?: boolean
	sourceCronJobId?: string
	sourceHttpMonitorId?: string
	startsAt?: Date
}

type CreateIncidentUpdateData = {
	incidentId: string
	status: IncidentStatus
	message: string
}

function toIncidentModel(incident: {
	id: string
	statusPageId: string
	title: string
	status: string
	severity: string
	componentIds: string[]
	autoCreated: boolean
	sourceCronJobId: string | null
	sourceHttpMonitorId: string | null
	startsAt: Date
	resolvedAt: Date | null
	createdAt: Date
	updatedAt: Date
}): IncidentModel {
	return {
		id: incident.id,
		statusPageId: incident.statusPageId,
		title: incident.title,
		status: incident.status as IncidentStatus,
		severity: incident.severity as IncidentSeverity,
		componentIds: incident.componentIds,
		autoCreated: incident.autoCreated,
		sourceCronJobId: incident.sourceCronJobId,
		sourceHttpMonitorId: incident.sourceHttpMonitorId,
		startsAt: incident.startsAt,
		resolvedAt: incident.resolvedAt,
		createdAt: incident.createdAt,
		updatedAt: incident.updatedAt,
	}
}

function toIncidentUpdateModel(update: {
	id: string
	incidentId: string
	status: string
	message: string
	createdAt: Date
}): IncidentUpdateModel {
	return {
		id: update.id,
		incidentId: update.incidentId,
		status: update.status as IncidentStatus,
		message: update.message,
		createdAt: update.createdAt,
	}
}

export const incidentRepository = {
	async findById(id: string): Promise<IncidentModel | null> {
		const incident = await prisma.incident.findUnique({ where: { id } })
		return incident ? toIncidentModel(incident) : null
	},

	async findByIdWithUpdates(id: string): Promise<IncidentWithUpdates | null> {
		const incident = await prisma.incident.findUnique({
			where: { id },
			include: {
				updates: { orderBy: { createdAt: "desc" } },
			},
		})
		if (!incident) return null
		return {
			...toIncidentModel(incident),
			updates: incident.updates.map(toIncidentUpdateModel),
		}
	},

	async findByStatusPageId(
		statusPageId: string,
		options?: {
			status?: IncidentStatus[]
			limit?: number
			offset?: number
		},
	): Promise<IncidentModel[]> {
		const incidents = await prisma.incident.findMany({
			where: {
				statusPageId,
				...(options?.status ? { status: { in: options.status } } : {}),
			},
			orderBy: { startsAt: "desc" },
			take: options?.limit,
			skip: options?.offset,
		})
		return incidents.map(toIncidentModel)
	},

	async findActiveByStatusPageId(
		statusPageId: string,
	): Promise<IncidentWithUpdates[]> {
		const incidents = await prisma.incident.findMany({
			where: {
				statusPageId,
				status: { not: "RESOLVED" },
			},
			orderBy: { startsAt: "desc" },
			include: {
				updates: { orderBy: { createdAt: "desc" } },
			},
		})
		return incidents.map((i) => ({
			...toIncidentModel(i),
			updates: i.updates.map(toIncidentUpdateModel),
		}))
	},

	async findRecentResolvedByStatusPageId(
		statusPageId: string,
		days: number,
	): Promise<IncidentWithUpdates[]> {
		const since = new Date()
		since.setDate(since.getDate() - days)

		const incidents = await prisma.incident.findMany({
			where: {
				statusPageId,
				status: "RESOLVED",
				resolvedAt: { gte: since },
			},
			orderBy: { resolvedAt: "desc" },
			include: {
				updates: { orderBy: { createdAt: "desc" } },
			},
		})
		return incidents.map((i) => ({
			...toIncidentModel(i),
			updates: i.updates.map(toIncidentUpdateModel),
		}))
	},

	async findAutoIncidentBySource(
		statusPageId: string,
		sourceCronJobId?: string,
		sourceHttpMonitorId?: string,
	): Promise<IncidentModel | null> {
		const incident = await prisma.incident.findFirst({
			where: {
				statusPageId,
				autoCreated: true,
				status: { not: "RESOLVED" },
				...(sourceCronJobId ? { sourceCronJobId } : {}),
				...(sourceHttpMonitorId ? { sourceHttpMonitorId } : {}),
			},
		})
		return incident ? toIncidentModel(incident) : null
	},

	async create(data: CreateIncidentData): Promise<IncidentModel> {
		const incident = await prisma.incident.create({
			data: {
				statusPageId: data.statusPageId,
				title: data.title,
				status: data.status ?? "INVESTIGATING",
				severity: data.severity,
				componentIds: data.componentIds,
				autoCreated: data.autoCreated ?? false,
				sourceCronJobId: data.sourceCronJobId,
				sourceHttpMonitorId: data.sourceHttpMonitorId,
				startsAt: data.startsAt ?? new Date(),
			},
		})
		return toIncidentModel(incident)
	},

	async update(
		id: string,
		data: {
			title?: string
			status?: IncidentStatus
			severity?: IncidentSeverity
			componentIds?: string[]
			resolvedAt?: Date | null
		},
	): Promise<IncidentModel> {
		const incident = await prisma.incident.update({
			where: { id },
			data: {
				title: data.title,
				status: data.status,
				severity: data.severity,
				componentIds: data.componentIds,
				resolvedAt: data.resolvedAt,
			},
		})
		return toIncidentModel(incident)
	},

	async delete(id: string): Promise<void> {
		await prisma.incident.delete({ where: { id } })
	},

	async createUpdate(
		data: CreateIncidentUpdateData,
	): Promise<IncidentUpdateModel> {
		const update = await prisma.incidentUpdate.create({
			data: {
				incidentId: data.incidentId,
				status: data.status,
				message: data.message,
			},
		})
		return toIncidentUpdateModel(update)
	},

	async findUpdatesByIncidentId(
		incidentId: string,
	): Promise<IncidentUpdateModel[]> {
		const updates = await prisma.incidentUpdate.findMany({
			where: { incidentId },
			orderBy: { createdAt: "desc" },
		})
		return updates.map(toIncidentUpdateModel)
	},

	async countByStatusPageId(statusPageId: string): Promise<number> {
		return prisma.incident.count({ where: { statusPageId } })
	},
}
