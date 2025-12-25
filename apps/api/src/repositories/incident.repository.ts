import { type IncidentImpact, type IncidentStatus, prisma } from "@haspulse/db"
import type {
	CreateIncidentInput,
	CreateIncidentUpdateInput,
	IncidentModel,
	IncidentUpdateModel,
	IncidentWithUpdatesModel,
	UpdateIncidentInput,
} from "../services/incident.service.js"

function toIncidentModel(incident: {
	id: string
	projectId: string
	title: string
	status: IncidentStatus
	impact: IncidentImpact
	autoCreated: boolean
	resolvedAt: Date | null
	createdAt: Date
	updatedAt: Date
}): IncidentModel {
	return {
		id: incident.id,
		projectId: incident.projectId,
		title: incident.title,
		status: incident.status,
		impact: incident.impact,
		autoCreated: incident.autoCreated,
		resolvedAt: incident.resolvedAt,
		createdAt: incident.createdAt,
		updatedAt: incident.updatedAt,
	}
}

function toIncidentUpdateModel(update: {
	id: string
	incidentId: string
	status: IncidentStatus
	message: string
	createdAt: Date
}): IncidentUpdateModel {
	return {
		id: update.id,
		incidentId: update.incidentId,
		status: update.status,
		message: update.message,
		createdAt: update.createdAt,
	}
}

export const incidentRepository = {
	async create(input: CreateIncidentInput): Promise<IncidentModel> {
		const incident = await prisma.incident.create({
			data: {
				projectId: input.projectId,
				title: input.title,
				status: input.status,
				impact: input.impact,
				autoCreated: input.autoCreated ?? false,
			},
		})
		return toIncidentModel(incident)
	},

	async findById(id: string): Promise<IncidentModel | null> {
		const incident = await prisma.incident.findUnique({ where: { id } })
		return incident ? toIncidentModel(incident) : null
	},

	async findByIdWithUpdates(
		id: string,
	): Promise<IncidentWithUpdatesModel | null> {
		const incident = await prisma.incident.findUnique({
			where: { id },
			include: {
				updates: { orderBy: { createdAt: "desc" } },
				checks: { select: { checkId: true } },
			},
		})
		if (!incident) return null
		return {
			...toIncidentModel(incident),
			updates: incident.updates.map(toIncidentUpdateModel),
			checkIds: incident.checks.map((c: { checkId: string }) => c.checkId),
		}
	},

	async findByProjectId(
		projectId: string,
		options?: { limit?: number; status?: IncidentStatus },
	): Promise<IncidentModel[]> {
		const incidents = await prisma.incident.findMany({
			where: {
				projectId,
				...(options?.status && { status: options.status }),
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit,
		})
		return incidents.map(toIncidentModel)
	},

	async findByProjectIdPaginated(
		projectId: string,
		page: number,
		limit: number,
		status?: IncidentStatus,
	): Promise<{ data: IncidentModel[]; total: number }> {
		const where = {
			projectId,
			...(status && { status }),
		}
		const [incidents, total] = await Promise.all([
			prisma.incident.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.incident.count({ where }),
		])
		return { data: incidents.map(toIncidentModel), total }
	},

	async findActiveByProjectId(projectId: string): Promise<IncidentModel[]> {
		const incidents = await prisma.incident.findMany({
			where: {
				projectId,
				status: { not: "RESOLVED" },
			},
			orderBy: { createdAt: "desc" },
		})
		return incidents.map(toIncidentModel)
	},

	async findActiveByCheckId(checkId: string): Promise<IncidentModel | null> {
		const incident = await prisma.incident.findFirst({
			where: {
				status: { not: "RESOLVED" },
				checks: { some: { checkId } },
			},
			orderBy: { createdAt: "desc" },
		})
		return incident ? toIncidentModel(incident) : null
	},

	async update(id: string, input: UpdateIncidentInput): Promise<IncidentModel> {
		const incident = await prisma.incident.update({
			where: { id },
			data: {
				title: input.title,
				status: input.status,
				impact: input.impact,
				resolvedAt: input.status === "RESOLVED" ? new Date() : undefined,
			},
		})
		return toIncidentModel(incident)
	},

	async delete(id: string): Promise<void> {
		await prisma.incident.delete({ where: { id } })
	},

	async addCheck(incidentId: string, checkId: string): Promise<void> {
		await prisma.incidentCheck.create({
			data: { incidentId, checkId },
		})
	},

	async removeCheck(incidentId: string, checkId: string): Promise<void> {
		await prisma.incidentCheck.delete({
			where: { incidentId_checkId: { incidentId, checkId } },
		})
	},

	async createUpdate(
		input: CreateIncidentUpdateInput,
	): Promise<IncidentUpdateModel> {
		const [update] = await prisma.$transaction([
			prisma.incidentUpdate.create({
				data: {
					incidentId: input.incidentId,
					status: input.status,
					message: input.message,
				},
			}),
			prisma.incident.update({
				where: { id: input.incidentId },
				data: {
					status: input.status,
					resolvedAt: input.status === "RESOLVED" ? new Date() : undefined,
				},
			}),
		])
		return toIncidentUpdateModel(update)
	},

	async getUpdates(incidentId: string): Promise<IncidentUpdateModel[]> {
		const updates = await prisma.incidentUpdate.findMany({
			where: { incidentId },
			orderBy: { createdAt: "desc" },
		})
		return updates.map(toIncidentUpdateModel)
	},
}
