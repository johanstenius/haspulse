import { prisma } from "@haspulse/db"

export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"

export type MaintenanceModel = {
	id: string
	statusPageId: string
	title: string
	description: string | null
	componentIds: string[]
	scheduledFor: Date
	expectedEnd: Date
	status: MaintenanceStatus
	createdAt: Date
	updatedAt: Date
}

type CreateMaintenanceData = {
	statusPageId: string
	title: string
	description?: string
	componentIds: string[]
	scheduledFor: Date
	expectedEnd: Date
}

type UpdateMaintenanceData = {
	title?: string
	description?: string | null
	componentIds?: string[]
	scheduledFor?: Date
	expectedEnd?: Date
	status?: MaintenanceStatus
}

function toMaintenanceModel(maintenance: {
	id: string
	statusPageId: string
	title: string
	description: string | null
	componentIds: string[]
	scheduledFor: Date
	expectedEnd: Date
	status: string
	createdAt: Date
	updatedAt: Date
}): MaintenanceModel {
	return {
		id: maintenance.id,
		statusPageId: maintenance.statusPageId,
		title: maintenance.title,
		description: maintenance.description,
		componentIds: maintenance.componentIds,
		scheduledFor: maintenance.scheduledFor,
		expectedEnd: maintenance.expectedEnd,
		status: maintenance.status as MaintenanceStatus,
		createdAt: maintenance.createdAt,
		updatedAt: maintenance.updatedAt,
	}
}

export const maintenanceRepository = {
	async findById(id: string): Promise<MaintenanceModel | null> {
		const maintenance = await prisma.maintenance.findUnique({ where: { id } })
		return maintenance ? toMaintenanceModel(maintenance) : null
	},

	async findByStatusPageId(
		statusPageId: string,
		options?: {
			status?: MaintenanceStatus[]
			limit?: number
			offset?: number
		},
	): Promise<MaintenanceModel[]> {
		const maintenances = await prisma.maintenance.findMany({
			where: {
				statusPageId,
				...(options?.status ? { status: { in: options.status } } : {}),
			},
			orderBy: { scheduledFor: "asc" },
			take: options?.limit,
			skip: options?.offset,
		})
		return maintenances.map(toMaintenanceModel)
	},

	async findUpcomingByStatusPageId(
		statusPageId: string,
	): Promise<MaintenanceModel[]> {
		const now = new Date()
		const maintenances = await prisma.maintenance.findMany({
			where: {
				statusPageId,
				status: { in: ["SCHEDULED", "IN_PROGRESS"] },
				expectedEnd: { gte: now },
			},
			orderBy: { scheduledFor: "asc" },
		})
		return maintenances.map(toMaintenanceModel)
	},

	async findActiveByStatusPageId(
		statusPageId: string,
	): Promise<MaintenanceModel[]> {
		const maintenances = await prisma.maintenance.findMany({
			where: {
				statusPageId,
				status: "IN_PROGRESS",
			},
			orderBy: { scheduledFor: "asc" },
		})
		return maintenances.map(toMaintenanceModel)
	},

	async findRecentCompletedByStatusPageId(
		statusPageId: string,
		days: number,
	): Promise<MaintenanceModel[]> {
		const since = new Date()
		since.setDate(since.getDate() - days)

		const maintenances = await prisma.maintenance.findMany({
			where: {
				statusPageId,
				status: "COMPLETED",
				expectedEnd: { gte: since },
			},
			orderBy: { expectedEnd: "desc" },
		})
		return maintenances.map(toMaintenanceModel)
	},

	async findDueToStart(): Promise<MaintenanceModel[]> {
		const now = new Date()
		const maintenances = await prisma.maintenance.findMany({
			where: {
				status: "SCHEDULED",
				scheduledFor: { lte: now },
			},
		})
		return maintenances.map(toMaintenanceModel)
	},

	async findDueToComplete(): Promise<MaintenanceModel[]> {
		const now = new Date()
		const maintenances = await prisma.maintenance.findMany({
			where: {
				status: "IN_PROGRESS",
				expectedEnd: { lte: now },
			},
		})
		return maintenances.map(toMaintenanceModel)
	},

	async create(data: CreateMaintenanceData): Promise<MaintenanceModel> {
		const maintenance = await prisma.maintenance.create({
			data: {
				statusPageId: data.statusPageId,
				title: data.title,
				description: data.description,
				componentIds: data.componentIds,
				scheduledFor: data.scheduledFor,
				expectedEnd: data.expectedEnd,
				status: "SCHEDULED",
			},
		})
		return toMaintenanceModel(maintenance)
	},

	async update(
		id: string,
		data: UpdateMaintenanceData,
	): Promise<MaintenanceModel> {
		const maintenance = await prisma.maintenance.update({
			where: { id },
			data: {
				title: data.title,
				description: data.description,
				componentIds: data.componentIds,
				scheduledFor: data.scheduledFor,
				expectedEnd: data.expectedEnd,
				status: data.status,
			},
		})
		return toMaintenanceModel(maintenance)
	},

	async delete(id: string): Promise<void> {
		await prisma.maintenance.delete({ where: { id } })
	},

	async countByStatusPageId(statusPageId: string): Promise<number> {
		return prisma.maintenance.count({ where: { statusPageId } })
	},
}
