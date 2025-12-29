import { logger } from "../lib/logger.js"
import {
	type IncidentModel,
	type IncidentSeverity,
	type IncidentStatus,
	type IncidentUpdateModel,
	type IncidentWithUpdates,
	incidentRepository,
} from "../repositories/incident.repository.js"
import { statusPageRepository } from "../repositories/status-page.repository.js"

export type {
	IncidentModel,
	IncidentSeverity,
	IncidentStatus,
	IncidentUpdateModel,
	IncidentWithUpdates,
}

export const incidentService = {
	async getById(id: string): Promise<IncidentModel | null> {
		return incidentRepository.findById(id)
	},

	async getByIdWithUpdates(id: string): Promise<IncidentWithUpdates | null> {
		return incidentRepository.findByIdWithUpdates(id)
	},

	async listByStatusPageId(
		statusPageId: string,
		options?: {
			status?: IncidentStatus[]
			limit?: number
			offset?: number
		},
	): Promise<IncidentModel[]> {
		return incidentRepository.findByStatusPageId(statusPageId, options)
	},

	async getActiveIncidents(
		statusPageId: string,
	): Promise<IncidentWithUpdates[]> {
		return incidentRepository.findActiveByStatusPageId(statusPageId)
	},

	async getRecentResolvedIncidents(
		statusPageId: string,
		days = 7,
	): Promise<IncidentWithUpdates[]> {
		return incidentRepository.findRecentResolvedByStatusPageId(
			statusPageId,
			days,
		)
	},

	async create(data: {
		statusPageId: string
		title: string
		severity: IncidentSeverity
		componentIds: string[]
		initialMessage?: string
	}): Promise<IncidentWithUpdates> {
		const incident = await incidentRepository.create({
			statusPageId: data.statusPageId,
			title: data.title,
			severity: data.severity,
			componentIds: data.componentIds,
			status: "INVESTIGATING",
		})

		const updates: IncidentUpdateModel[] = []
		if (data.initialMessage) {
			const update = await incidentRepository.createUpdate({
				incidentId: incident.id,
				status: "INVESTIGATING",
				message: data.initialMessage,
			})
			updates.push(update)
		}

		return { ...incident, updates }
	},

	async createAutoIncident(data: {
		statusPageId: string
		title: string
		severity: IncidentSeverity
		componentIds: string[]
		sourceCronJobId?: string
		sourceHttpMonitorId?: string
	}): Promise<IncidentModel> {
		return incidentRepository.create({
			statusPageId: data.statusPageId,
			title: data.title,
			severity: data.severity,
			componentIds: data.componentIds,
			autoCreated: true,
			sourceCronJobId: data.sourceCronJobId,
			sourceHttpMonitorId: data.sourceHttpMonitorId,
		})
	},

	async update(
		id: string,
		data: {
			title?: string
			severity?: IncidentSeverity
			componentIds?: string[]
		},
	): Promise<IncidentModel> {
		return incidentRepository.update(id, data)
	},

	async addUpdate(data: {
		incidentId: string
		status: IncidentStatus
		message: string
	}): Promise<IncidentUpdateModel> {
		const update = await incidentRepository.createUpdate({
			incidentId: data.incidentId,
			status: data.status,
			message: data.message,
		})

		// Update incident status
		await incidentRepository.update(data.incidentId, {
			status: data.status,
			resolvedAt: data.status === "RESOLVED" ? new Date() : undefined,
		})

		return update
	},

	async resolve(incidentId: string, message?: string): Promise<IncidentModel> {
		if (message) {
			await incidentRepository.createUpdate({
				incidentId,
				status: "RESOLVED",
				message,
			})
		}

		return incidentRepository.update(incidentId, {
			status: "RESOLVED",
			resolvedAt: new Date(),
		})
	},

	async resolveAutoIncident(
		statusPageId: string,
		sourceCronJobId?: string,
		sourceHttpMonitorId?: string,
	): Promise<IncidentModel | null> {
		const incident = await incidentRepository.findAutoIncidentBySource(
			statusPageId,
			sourceCronJobId,
			sourceHttpMonitorId,
		)

		if (!incident) return null

		await incidentRepository.createUpdate({
			incidentId: incident.id,
			status: "RESOLVED",
			message: "Service has recovered automatically.",
		})

		return incidentRepository.update(incident.id, {
			status: "RESOLVED",
			resolvedAt: new Date(),
		})
	},

	async delete(id: string): Promise<void> {
		await incidentRepository.delete(id)
	},

	async getUpdates(incidentId: string): Promise<IncidentUpdateModel[]> {
		return incidentRepository.findUpdatesByIncidentId(incidentId)
	},

	async shouldCreateAutoIncident(
		statusPageId: string,
		sourceCronJobId?: string,
		sourceHttpMonitorId?: string,
	): Promise<boolean> {
		const page = await statusPageRepository.findByProjectId(statusPageId)
		if (!page?.autoIncidents) return false

		// Check if an active auto-incident already exists for this source
		const existing = await incidentRepository.findAutoIncidentBySource(
			page.id,
			sourceCronJobId,
			sourceHttpMonitorId,
		)

		return !existing
	},

	async handleMonitorDown(
		projectId: string,
		monitorName: string,
		sourceCronJobId?: string,
		sourceHttpMonitorId?: string,
	): Promise<IncidentModel | null> {
		const page = await statusPageRepository.findByProjectId(projectId)
		if (!page?.autoIncidents) return null

		// Find component for this monitor
		const components = await statusPageRepository.findComponents(page.id)
		const affectedComponent = components.find(
			(c) =>
				c.cronJobId === sourceCronJobId ||
				c.httpMonitorId === sourceHttpMonitorId,
		)
		if (!affectedComponent) return null

		// Check if an active auto-incident already exists
		const existing = await incidentRepository.findAutoIncidentBySource(
			page.id,
			sourceCronJobId,
			sourceHttpMonitorId,
		)
		if (existing) return null

		// Create auto-incident
		const incident = await incidentRepository.create({
			statusPageId: page.id,
			title: `${monitorName} is experiencing issues`,
			severity: "MAJOR",
			componentIds: [affectedComponent.id],
			autoCreated: true,
			sourceCronJobId,
			sourceHttpMonitorId,
		})

		await incidentRepository.createUpdate({
			incidentId: incident.id,
			status: "INVESTIGATING",
			message: "Service monitoring has detected an issue. Investigating...",
		})

		logger.info(
			{
				incidentId: incident.id,
				projectId,
				monitorName,
				sourceCronJobId,
				sourceHttpMonitorId,
			},
			"Auto-incident created",
		)

		return incident
	},

	async handleMonitorRecovered(
		projectId: string,
		monitorName: string,
		sourceCronJobId?: string,
		sourceHttpMonitorId?: string,
	): Promise<IncidentModel | null> {
		const page = await statusPageRepository.findByProjectId(projectId)
		if (!page) return null

		// Find active auto-incident for this source
		const incident = await incidentRepository.findAutoIncidentBySource(
			page.id,
			sourceCronJobId,
			sourceHttpMonitorId,
		)
		if (!incident) return null

		// Resolve the incident
		await incidentRepository.createUpdate({
			incidentId: incident.id,
			status: "RESOLVED",
			message: `${monitorName} has recovered and is operating normally.`,
		})

		const resolved = await incidentRepository.update(incident.id, {
			status: "RESOLVED",
			resolvedAt: new Date(),
		})

		logger.info(
			{
				incidentId: incident.id,
				projectId,
				monitorName,
			},
			"Auto-incident resolved",
		)

		return resolved
	},
}
