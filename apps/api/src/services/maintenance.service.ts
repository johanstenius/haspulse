import {
	type MaintenanceModel,
	type MaintenanceStatus,
	maintenanceRepository,
} from "../repositories/maintenance.repository.js"

export type { MaintenanceModel, MaintenanceStatus }

export const maintenanceService = {
	async getById(id: string): Promise<MaintenanceModel | null> {
		return maintenanceRepository.findById(id)
	},

	async listByStatusPageId(
		statusPageId: string,
		options?: {
			status?: MaintenanceStatus[]
			limit?: number
			offset?: number
		},
	): Promise<MaintenanceModel[]> {
		return maintenanceRepository.findByStatusPageId(statusPageId, options)
	},

	async getUpcomingMaintenances(
		statusPageId: string,
	): Promise<MaintenanceModel[]> {
		return maintenanceRepository.findUpcomingByStatusPageId(statusPageId)
	},

	async getActiveMaintenances(
		statusPageId: string,
	): Promise<MaintenanceModel[]> {
		return maintenanceRepository.findActiveByStatusPageId(statusPageId)
	},

	async getRecentCompletedMaintenances(
		statusPageId: string,
		days = 7,
	): Promise<MaintenanceModel[]> {
		return maintenanceRepository.findRecentCompletedByStatusPageId(
			statusPageId,
			days,
		)
	},

	async create(data: {
		statusPageId: string
		title: string
		description?: string
		componentIds: string[]
		scheduledFor: Date
		expectedEnd: Date
	}): Promise<MaintenanceModel> {
		return maintenanceRepository.create(data)
	},

	async update(
		id: string,
		data: {
			title?: string
			description?: string | null
			componentIds?: string[]
			scheduledFor?: Date
			expectedEnd?: Date
			status?: MaintenanceStatus
		},
	): Promise<MaintenanceModel> {
		return maintenanceRepository.update(id, data)
	},

	async startMaintenance(id: string): Promise<MaintenanceModel> {
		return maintenanceRepository.update(id, { status: "IN_PROGRESS" })
	},

	async completeMaintenance(id: string): Promise<MaintenanceModel> {
		return maintenanceRepository.update(id, { status: "COMPLETED" })
	},

	async delete(id: string): Promise<void> {
		await maintenanceRepository.delete(id)
	},

	async processScheduledMaintenances(): Promise<void> {
		const dueToStart = await maintenanceRepository.findDueToStart()
		for (const maintenance of dueToStart) {
			await maintenanceRepository.update(maintenance.id, {
				status: "IN_PROGRESS",
			})
		}

		const dueToComplete = await maintenanceRepository.findDueToComplete()
		for (const maintenance of dueToComplete) {
			await maintenanceRepository.update(maintenance.id, {
				status: "COMPLETED",
			})
		}
	},
}
