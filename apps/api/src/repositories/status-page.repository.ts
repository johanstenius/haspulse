import { type MonitorStatus, prisma } from "@haspulse/db"
import type {
	StatusPageComponentModel,
	StatusPageModel,
} from "../services/status-page.service.js"

export type ComponentWithStatus = {
	id: string
	statusPageId: string
	cronJobId: string | null
	httpMonitorId: string | null
	displayName: string
	groupName: string | null
	sortOrder: number
	createdAt: Date
	updatedAt: Date
	cronJob: {
		id: string
		status: MonitorStatus
		lastPingAt: Date | null
	} | null
	httpMonitor: {
		id: string
		status: MonitorStatus
		lastCheckedAt: Date | null
		lastResponseMs: number | null
	} | null
}

type CreateStatusPageData = {
	projectId: string
	slug: string
	name: string
	description?: string
	accentColor?: string
	theme?: "LIGHT" | "DARK" | "SYSTEM"
	showUptime?: boolean
	uptimeDays?: number
	autoIncidents?: boolean
}

type UpdateStatusPageData = {
	slug?: string
	name?: string
	description?: string | null
	logoUrl?: string | null
	accentColor?: string
	theme?: "LIGHT" | "DARK" | "SYSTEM"
	customDomain?: string | null
	showUptime?: boolean
	uptimeDays?: number
	autoIncidents?: boolean
}

type CreateComponentData = {
	statusPageId: string
	cronJobId?: string
	httpMonitorId?: string
	displayName: string
	groupName?: string
	sortOrder?: number
}

type UpdateComponentData = {
	displayName?: string
	groupName?: string | null
	sortOrder?: number
}

function toStatusPageModel(page: {
	id: string
	projectId: string
	slug: string
	name: string
	description: string | null
	logoUrl: string | null
	accentColor: string
	theme: string
	customDomain: string | null
	domainVerified: boolean
	verifyToken: string | null
	showUptime: boolean
	uptimeDays: number
	autoIncidents: boolean
	createdAt: Date
	updatedAt: Date
}): StatusPageModel {
	return {
		id: page.id,
		projectId: page.projectId,
		slug: page.slug,
		name: page.name,
		description: page.description,
		logoUrl: page.logoUrl,
		accentColor: page.accentColor,
		theme: page.theme as "LIGHT" | "DARK" | "SYSTEM",
		customDomain: page.customDomain,
		domainVerified: page.domainVerified,
		verifyToken: page.verifyToken,
		showUptime: page.showUptime,
		uptimeDays: page.uptimeDays,
		autoIncidents: page.autoIncidents,
		createdAt: page.createdAt,
		updatedAt: page.updatedAt,
	}
}

function toComponentModel(comp: {
	id: string
	statusPageId: string
	cronJobId: string | null
	httpMonitorId: string | null
	displayName: string
	groupName: string | null
	sortOrder: number
	createdAt: Date
	updatedAt: Date
}): StatusPageComponentModel {
	return {
		id: comp.id,
		statusPageId: comp.statusPageId,
		cronJobId: comp.cronJobId,
		httpMonitorId: comp.httpMonitorId,
		displayName: comp.displayName,
		groupName: comp.groupName,
		sortOrder: comp.sortOrder,
		createdAt: comp.createdAt,
		updatedAt: comp.updatedAt,
	}
}

export const statusPageRepository = {
	async findById(id: string): Promise<StatusPageModel | null> {
		const page = await prisma.statusPage.findUnique({
			where: { id },
		})
		return page ? toStatusPageModel(page) : null
	},

	async findByProjectId(projectId: string): Promise<StatusPageModel | null> {
		const page = await prisma.statusPage.findUnique({
			where: { projectId },
		})
		return page ? toStatusPageModel(page) : null
	},

	async findBySlug(slug: string): Promise<StatusPageModel | null> {
		const page = await prisma.statusPage.findUnique({
			where: { slug },
		})
		return page ? toStatusPageModel(page) : null
	},

	async findByCustomDomain(domain: string): Promise<StatusPageModel | null> {
		const page = await prisma.statusPage.findUnique({
			where: { customDomain: domain },
		})
		return page ? toStatusPageModel(page) : null
	},

	async slugExists(slug: string, excludeId?: string): Promise<boolean> {
		const count = await prisma.statusPage.count({
			where: {
				slug,
				...(excludeId ? { NOT: { id: excludeId } } : {}),
			},
		})
		return count > 0
	},

	async create(data: CreateStatusPageData): Promise<StatusPageModel> {
		const page = await prisma.statusPage.create({
			data: {
				projectId: data.projectId,
				slug: data.slug,
				name: data.name,
				description: data.description,
				accentColor: data.accentColor ?? "#10b981",
				theme: data.theme ?? "SYSTEM",
				showUptime: data.showUptime ?? true,
				uptimeDays: data.uptimeDays ?? 90,
				autoIncidents: data.autoIncidents ?? false,
			},
		})
		return toStatusPageModel(page)
	},

	async update(
		id: string,
		data: UpdateStatusPageData,
	): Promise<StatusPageModel> {
		const page = await prisma.statusPage.update({
			where: { id },
			data: {
				slug: data.slug,
				name: data.name,
				description: data.description,
				logoUrl: data.logoUrl,
				accentColor: data.accentColor,
				theme: data.theme,
				customDomain: data.customDomain,
				showUptime: data.showUptime,
				uptimeDays: data.uptimeDays,
				autoIncidents: data.autoIncidents,
			},
		})
		return toStatusPageModel(page)
	},

	async delete(id: string): Promise<void> {
		await prisma.statusPage.delete({ where: { id } })
	},

	async setVerifyToken(id: string, token: string): Promise<void> {
		await prisma.statusPage.update({
			where: { id },
			data: { verifyToken: token },
		})
	},

	async setDomainVerified(id: string, verified: boolean): Promise<void> {
		await prisma.statusPage.update({
			where: { id },
			data: {
				domainVerified: verified,
				verifyToken: verified ? null : undefined,
			},
		})
	},

	// Components
	async findComponents(
		statusPageId: string,
	): Promise<StatusPageComponentModel[]> {
		const components = await prisma.statusPageComponent.findMany({
			where: { statusPageId },
			orderBy: { sortOrder: "asc" },
		})
		return components.map(toComponentModel)
	},

	async findComponentById(
		id: string,
	): Promise<StatusPageComponentModel | null> {
		const comp = await prisma.statusPageComponent.findUnique({
			where: { id },
		})
		return comp ? toComponentModel(comp) : null
	},

	async createComponent(
		data: CreateComponentData,
	): Promise<StatusPageComponentModel> {
		const comp = await prisma.statusPageComponent.create({
			data: {
				statusPageId: data.statusPageId,
				cronJobId: data.cronJobId,
				httpMonitorId: data.httpMonitorId,
				displayName: data.displayName,
				groupName: data.groupName,
				sortOrder: data.sortOrder ?? 0,
			},
		})
		return toComponentModel(comp)
	},

	async updateComponent(
		id: string,
		data: UpdateComponentData,
	): Promise<StatusPageComponentModel> {
		const comp = await prisma.statusPageComponent.update({
			where: { id },
			data: {
				displayName: data.displayName,
				groupName: data.groupName,
				sortOrder: data.sortOrder,
			},
		})
		return toComponentModel(comp)
	},

	async deleteComponent(id: string): Promise<void> {
		await prisma.statusPageComponent.delete({ where: { id } })
	},

	async reorderComponents(
		statusPageId: string,
		componentIds: string[],
	): Promise<void> {
		await prisma.$transaction(
			componentIds.map((id, index) =>
				prisma.statusPageComponent.update({
					where: { id },
					data: { sortOrder: index },
				}),
			),
		)
	},

	// For public status page - get components with their monitors
	async findComponentsWithStatus(
		statusPageId: string,
	): Promise<ComponentWithStatus[]> {
		return prisma.statusPageComponent.findMany({
			where: { statusPageId },
			orderBy: { sortOrder: "asc" },
			include: {
				cronJob: {
					select: {
						id: true,
						status: true,
						lastPingAt: true,
					},
				},
				httpMonitor: {
					select: {
						id: true,
						status: true,
						lastCheckedAt: true,
						lastResponseMs: true,
					},
				},
			},
		})
	},
}
