import { prisma } from "@haspulse/db"
import type {
	CreateMaintenanceInput,
	MaintenanceModel,
	MaintenanceWithChecksModel,
	UpdateMaintenanceInput,
} from "../services/maintenance.service.js"

function toMaintenanceModel(maintenance: {
	id: string
	projectId: string
	title: string
	description: string | null
	startsAt: Date
	endsAt: Date
	createdAt: Date
	updatedAt: Date
}): MaintenanceModel {
	return {
		id: maintenance.id,
		projectId: maintenance.projectId,
		title: maintenance.title,
		description: maintenance.description,
		startsAt: maintenance.startsAt,
		endsAt: maintenance.endsAt,
		createdAt: maintenance.createdAt,
		updatedAt: maintenance.updatedAt,
	}
}

export const maintenanceRepository = {
	async create(input: CreateMaintenanceInput): Promise<MaintenanceModel> {
		const maintenance = await prisma.maintenance.create({
			data: {
				projectId: input.projectId,
				title: input.title,
				description: input.description,
				startsAt: input.startsAt,
				endsAt: input.endsAt,
			},
		})
		return toMaintenanceModel(maintenance)
	},

	async findById(id: string): Promise<MaintenanceModel | null> {
		const maintenance = await prisma.maintenance.findUnique({ where: { id } })
		return maintenance ? toMaintenanceModel(maintenance) : null
	},

	async findByIdWithChecks(
		id: string,
	): Promise<MaintenanceWithChecksModel | null> {
		const maintenance = await prisma.maintenance.findUnique({
			where: { id },
			include: { checks: { select: { checkId: true } } },
		})
		if (!maintenance) return null
		return {
			...toMaintenanceModel(maintenance),
			checkIds: maintenance.checks.map((c) => c.checkId),
		}
	},

	async findByProjectId(
		projectId: string,
		options?: { upcoming?: boolean; limit?: number },
	): Promise<MaintenanceModel[]> {
		const now = new Date()
		const maintenances = await prisma.maintenance.findMany({
			where: {
				projectId,
				...(options?.upcoming && { endsAt: { gte: now } }),
			},
			orderBy: { startsAt: "asc" },
			take: options?.limit,
		})
		return maintenances.map(toMaintenanceModel)
	},

	async findByProjectIdPaginated(
		projectId: string,
		page: number,
		limit: number,
		upcoming?: boolean,
	): Promise<{ data: MaintenanceModel[]; total: number }> {
		const now = new Date()
		const where = {
			projectId,
			...(upcoming && { endsAt: { gte: now } }),
		}
		const [maintenances, total] = await Promise.all([
			prisma.maintenance.findMany({
				where,
				orderBy: { startsAt: "asc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.maintenance.count({ where }),
		])
		return { data: maintenances.map(toMaintenanceModel), total }
	},

	async findActiveByProjectId(projectId: string): Promise<MaintenanceModel[]> {
		const now = new Date()
		const maintenances = await prisma.maintenance.findMany({
			where: {
				projectId,
				startsAt: { lte: now },
				endsAt: { gte: now },
			},
			orderBy: { startsAt: "asc" },
		})
		return maintenances.map(toMaintenanceModel)
	},

	async findUpcomingByProjectId(
		projectId: string,
		limit = 5,
	): Promise<MaintenanceModel[]> {
		const now = new Date()
		const maintenances = await prisma.maintenance.findMany({
			where: {
				projectId,
				startsAt: { gt: now },
			},
			orderBy: { startsAt: "asc" },
			take: limit,
		})
		return maintenances.map(toMaintenanceModel)
	},

	async update(
		id: string,
		input: UpdateMaintenanceInput,
	): Promise<MaintenanceModel> {
		const maintenance = await prisma.maintenance.update({
			where: { id },
			data: {
				title: input.title,
				description: input.description,
				startsAt: input.startsAt,
				endsAt: input.endsAt,
			},
		})
		return toMaintenanceModel(maintenance)
	},

	async delete(id: string): Promise<void> {
		await prisma.maintenance.delete({ where: { id } })
	},

	async addCheck(maintenanceId: string, checkId: string): Promise<void> {
		await prisma.maintenanceCheck.create({
			data: { maintenanceId, checkId },
		})
	},

	async removeCheck(maintenanceId: string, checkId: string): Promise<void> {
		await prisma.maintenanceCheck.delete({
			where: { maintenanceId_checkId: { maintenanceId, checkId } },
		})
	},

	async setCheckIds(maintenanceId: string, checkIds: string[]): Promise<void> {
		await prisma.$transaction([
			prisma.maintenanceCheck.deleteMany({ where: { maintenanceId } }),
			prisma.maintenanceCheck.createMany({
				data: checkIds.map((checkId) => ({ maintenanceId, checkId })),
			}),
		])
	},

	async getCheckIds(maintenanceId: string): Promise<string[]> {
		const checks = await prisma.maintenanceCheck.findMany({
			where: { maintenanceId },
			select: { checkId: true },
		})
		return checks.map((c) => c.checkId)
	},
}
