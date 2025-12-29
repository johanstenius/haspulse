import type { MonitorStatus } from "@haspulse/db"
import {
	type IncidentStatus,
	type IncidentWithUpdates,
	incidentRepository,
} from "../repositories/incident.repository.js"
import { maintenanceRepository } from "../repositories/maintenance.repository.js"
import { statusPageRepository } from "../repositories/status-page.repository.js"
import {
	type UptimeDay,
	getCronJobsUptimeHistory,
	getHttpMonitorsUptimeHistory,
} from "./stats.service.js"

export type StatusPageModel = {
	id: string
	projectId: string
	slug: string
	name: string
	description: string | null
	logoUrl: string | null
	accentColor: string
	theme: "LIGHT" | "DARK" | "SYSTEM"
	customDomain: string | null
	domainVerified: boolean
	verifyToken: string | null
	showUptime: boolean
	uptimeDays: number
	autoIncidents: boolean
	createdAt: Date
	updatedAt: Date
}

export type StatusPageComponentModel = {
	id: string
	statusPageId: string
	cronJobId: string | null
	httpMonitorId: string | null
	displayName: string
	groupName: string | null
	sortOrder: number
	createdAt: Date
	updatedAt: Date
}

export type ComponentStatus =
	| "operational"
	| "degraded"
	| "partial_outage"
	| "major_outage"

export type PublicComponentModel = {
	id: string
	displayName: string
	groupName: string | null
	status: ComponentStatus
	lastCheckedAt: Date | null
	uptimeHistory: UptimeDay[]
}

export type PublicIncidentUpdateModel = {
	id: string
	status: IncidentStatus
	message: string
	createdAt: Date
}

export type PublicIncidentModel = {
	id: string
	title: string
	status: IncidentStatus
	severity: "MINOR" | "MAJOR" | "CRITICAL"
	componentIds: string[]
	startsAt: Date
	resolvedAt: Date | null
	updates: PublicIncidentUpdateModel[]
}

export type PublicMaintenanceModel = {
	id: string
	title: string
	description: string | null
	componentIds: string[]
	scheduledFor: Date
	expectedEnd: Date
	status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
}

export type PublicStatusPageModel = {
	name: string
	description: string | null
	logoUrl: string | null
	accentColor: string
	theme: "LIGHT" | "DARK" | "SYSTEM"
	overallStatus: ComponentStatus
	components: PublicComponentModel[]
	activeIncidents: PublicIncidentModel[]
	recentIncidents: PublicIncidentModel[]
	upcomingMaintenances: PublicMaintenanceModel[]
}

function monitorStatusToComponentStatus(
	status: MonitorStatus,
): ComponentStatus {
	switch (status) {
		case "UP":
		case "NEW":
		case "PAUSED":
			return "operational"
		case "LATE":
			return "degraded"
		case "DOWN":
			return "major_outage"
		default:
			return "operational"
	}
}

function deriveOverallStatus(
	components: PublicComponentModel[],
): ComponentStatus {
	if (components.length === 0) return "operational"

	const hasOutage = components.some((c) => c.status === "major_outage")
	if (hasOutage) return "major_outage"

	const hasPartial = components.some((c) => c.status === "partial_outage")
	if (hasPartial) return "partial_outage"

	const hasDegraded = components.some((c) => c.status === "degraded")
	if (hasDegraded) return "degraded"

	return "operational"
}

function generateVerifyToken(): string {
	const bytes = new Uint8Array(16)
	crypto.getRandomValues(bytes)
	return `hp_${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`
}

export const statusPageService = {
	async getByProjectId(projectId: string): Promise<StatusPageModel | null> {
		return statusPageRepository.findByProjectId(projectId)
	},

	async getBySlug(slug: string): Promise<StatusPageModel | null> {
		return statusPageRepository.findBySlug(slug)
	},

	async create(data: {
		projectId: string
		slug: string
		name: string
		description?: string
		accentColor?: string
		theme?: "LIGHT" | "DARK" | "SYSTEM"
		showUptime?: boolean
		uptimeDays?: number
		autoIncidents?: boolean
	}): Promise<StatusPageModel> {
		// Check slug uniqueness
		const exists = await statusPageRepository.slugExists(data.slug)
		if (exists) {
			throw new Error("Status page slug already exists")
		}

		return statusPageRepository.create(data)
	},

	async update(
		id: string,
		data: {
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
		},
	): Promise<StatusPageModel> {
		// Check slug uniqueness if changing
		if (data.slug) {
			const exists = await statusPageRepository.slugExists(data.slug, id)
			if (exists) {
				throw new Error("Status page slug already exists")
			}
		}

		// If setting custom domain, generate verify token
		if (data.customDomain) {
			const token = generateVerifyToken()
			await statusPageRepository.setVerifyToken(id, token)
		}

		return statusPageRepository.update(id, data)
	},

	async delete(id: string): Promise<void> {
		await statusPageRepository.delete(id)
	},

	// Components
	async getComponents(
		statusPageId: string,
	): Promise<StatusPageComponentModel[]> {
		return statusPageRepository.findComponents(statusPageId)
	},

	async addComponent(data: {
		statusPageId: string
		cronJobId?: string
		httpMonitorId?: string
		displayName: string
		groupName?: string
		sortOrder?: number
	}): Promise<StatusPageComponentModel> {
		if (!data.cronJobId && !data.httpMonitorId) {
			throw new Error("Component must have either cronJobId or httpMonitorId")
		}
		if (data.cronJobId && data.httpMonitorId) {
			throw new Error("Component cannot have both cronJobId and httpMonitorId")
		}

		return statusPageRepository.createComponent(data)
	},

	async updateComponent(
		id: string,
		data: {
			displayName?: string
			groupName?: string | null
			sortOrder?: number
		},
	): Promise<StatusPageComponentModel> {
		return statusPageRepository.updateComponent(id, data)
	},

	async removeComponent(id: string): Promise<void> {
		await statusPageRepository.deleteComponent(id)
	},

	async reorderComponents(
		statusPageId: string,
		componentIds: string[],
	): Promise<void> {
		await statusPageRepository.reorderComponents(statusPageId, componentIds)
	},

	// Public status page data
	async getPublicStatusPage(
		slug: string,
	): Promise<PublicStatusPageModel | null> {
		const page = await statusPageRepository.findBySlug(slug)
		if (!page) return null

		const componentsWithStatus =
			await statusPageRepository.findComponentsWithStatus(page.id)

		// Collect cron job and http monitor IDs
		const cronJobIds = componentsWithStatus
			.filter((c) => c.cronJobId)
			.map((c) => c.cronJobId as string)
		const httpMonitorIds = componentsWithStatus
			.filter((c) => c.httpMonitorId)
			.map((c) => c.httpMonitorId as string)

		// Fetch uptime history if showUptime is enabled
		let cronJobUptimeMap = new Map<string, UptimeDay[]>()
		let httpMonitorUptimeMap = new Map<string, UptimeDay[]>()

		if (page.showUptime) {
			if (cronJobIds.length > 0) {
				cronJobUptimeMap = await getCronJobsUptimeHistory(
					cronJobIds,
					page.uptimeDays,
				)
			}
			if (httpMonitorIds.length > 0) {
				httpMonitorUptimeMap = await getHttpMonitorsUptimeHistory(
					httpMonitorIds,
					page.uptimeDays,
				)
			}
		}

		const components: PublicComponentModel[] = componentsWithStatus.map(
			(comp) => {
				let status: ComponentStatus = "operational"
				let lastCheckedAt: Date | null = null
				let uptimeHistory: UptimeDay[] = []

				if (comp.cronJob) {
					status = monitorStatusToComponentStatus(comp.cronJob.status)
					lastCheckedAt = comp.cronJob.lastPingAt
					uptimeHistory = cronJobUptimeMap.get(comp.cronJob.id) ?? []
				} else if (comp.httpMonitor) {
					status = monitorStatusToComponentStatus(comp.httpMonitor.status)
					lastCheckedAt = comp.httpMonitor.lastCheckedAt
					uptimeHistory = httpMonitorUptimeMap.get(comp.httpMonitor.id) ?? []
				}

				return {
					id: comp.id,
					displayName: comp.displayName,
					groupName: comp.groupName,
					status,
					lastCheckedAt,
					uptimeHistory,
				}
			},
		)

		// Fetch incidents and maintenances
		const [activeIncidentsData, recentIncidentsData, upcomingMaintenancesData] =
			await Promise.all([
				incidentRepository.findActiveByStatusPageId(page.id),
				incidentRepository.findRecentResolvedByStatusPageId(page.id, 7),
				maintenanceRepository.findUpcomingByStatusPageId(page.id),
			])

		const mapIncident = (inc: IncidentWithUpdates): PublicIncidentModel => ({
			id: inc.id,
			title: inc.title,
			status: inc.status,
			severity: inc.severity,
			componentIds: inc.componentIds,
			startsAt: inc.startsAt,
			resolvedAt: inc.resolvedAt,
			updates: inc.updates.map((u) => ({
				id: u.id,
				status: u.status,
				message: u.message,
				createdAt: u.createdAt,
			})),
		})

		const activeIncidents = activeIncidentsData.map(mapIncident)
		const recentIncidents = recentIncidentsData.map(mapIncident)
		const upcomingMaintenances: PublicMaintenanceModel[] =
			upcomingMaintenancesData.map((m) => ({
				id: m.id,
				title: m.title,
				description: m.description,
				componentIds: m.componentIds,
				scheduledFor: m.scheduledFor,
				expectedEnd: m.expectedEnd,
				status: m.status,
			}))

		return {
			name: page.name,
			description: page.description,
			logoUrl: page.logoUrl,
			accentColor: page.accentColor,
			theme: page.theme,
			overallStatus: deriveOverallStatus(components),
			components,
			activeIncidents,
			recentIncidents,
			upcomingMaintenances,
		}
	},

	async getPublicStatusPageByDomain(
		domain: string,
	): Promise<PublicStatusPageModel | null> {
		const page = await statusPageRepository.findByCustomDomain(domain)
		if (!page || !page.domainVerified) return null

		return this.getPublicStatusPage(page.slug)
	},

	// Domain verification
	async setCustomDomain(
		id: string,
		domain: string | null,
	): Promise<{ verifyToken: string | null }> {
		if (!domain) {
			await statusPageRepository.update(id, { customDomain: null })
			await statusPageRepository.setDomainVerified(id, false)
			return { verifyToken: null }
		}

		// Normalize domain (lowercase, no trailing dot)
		const normalizedDomain = domain.toLowerCase().replace(/\.$/, "")

		// Generate new verify token
		const token = generateVerifyToken()
		await statusPageRepository.setVerifyToken(id, token)
		await statusPageRepository.update(id, { customDomain: normalizedDomain })
		await statusPageRepository.setDomainVerified(id, false)

		return { verifyToken: token }
	},

	async verifyDomain(statusPageId: string): Promise<{
		verified: boolean
		error?: string
	}> {
		const page = await statusPageRepository.findById(statusPageId)
		if (!page?.customDomain || !page.verifyToken) {
			return { verified: false, error: "No custom domain or verify token set" }
		}

		// Check DNS TXT record
		const txtRecord = `_haspulse.${page.customDomain}`
		const expectedValue = page.verifyToken

		try {
			const { promises: dns } = await import("node:dns")
			const records = await dns.resolveTxt(txtRecord)
			// records is array of arrays, flatten
			const flatRecords = records.flat()

			if (flatRecords.includes(expectedValue)) {
				await statusPageRepository.setDomainVerified(page.id, true)
				return { verified: true }
			}

			return {
				verified: false,
				error: `TXT record not found. Expected ${txtRecord} = ${expectedValue}`,
			}
		} catch (err) {
			const dnsError = err as NodeJS.ErrnoException
			if (dnsError.code === "ENODATA" || dnsError.code === "ENOTFOUND") {
				return {
					verified: false,
					error: `TXT record ${txtRecord} not found. Add it to your DNS.`,
				}
			}
			return {
				verified: false,
				error: `DNS lookup failed: ${dnsError.message}`,
			}
		}
	},
}
