import { maintenanceRepository } from "../repositories/maintenance.repository.js"

export type MaintenanceModel = {
	id: string
	projectId: string
	title: string
	description: string | null
	startsAt: Date
	endsAt: Date
	createdAt: Date
	updatedAt: Date
}

export type MaintenanceWithChecksModel = MaintenanceModel & {
	checkIds: string[]
}

export type CreateMaintenanceInput = {
	projectId: string
	title: string
	description?: string | null
	startsAt: Date
	endsAt: Date
	checkIds?: string[]
}

export type UpdateMaintenanceInput = {
	title?: string
	description?: string | null
	startsAt?: Date
	endsAt?: Date
}

export async function createMaintenance(
	input: CreateMaintenanceInput,
): Promise<MaintenanceModel> {
	const maintenance = await maintenanceRepository.create({
		projectId: input.projectId,
		title: input.title,
		description: input.description ?? null,
		startsAt: input.startsAt,
		endsAt: input.endsAt,
	})

	if (input.checkIds?.length) {
		await maintenanceRepository.setCheckIds(maintenance.id, input.checkIds)
	}

	return maintenance
}

export async function getMaintenanceById(
	id: string,
): Promise<MaintenanceModel | null> {
	return maintenanceRepository.findById(id)
}

export async function getMaintenanceWithChecks(
	id: string,
): Promise<MaintenanceWithChecksModel | null> {
	return maintenanceRepository.findByIdWithChecks(id)
}

export async function listMaintenanceByProject(
	projectId: string,
	options?: { upcoming?: boolean; limit?: number },
): Promise<MaintenanceModel[]> {
	return maintenanceRepository.findByProjectId(projectId, options)
}

export async function listMaintenanceByProjectPaginated(
	projectId: string,
	page: number,
	limit: number,
	upcoming?: boolean,
): Promise<{ data: MaintenanceModel[]; total: number }> {
	return maintenanceRepository.findByProjectIdPaginated(
		projectId,
		page,
		limit,
		upcoming,
	)
}

export async function listActiveMaintenance(
	projectId: string,
): Promise<MaintenanceModel[]> {
	return maintenanceRepository.findActiveByProjectId(projectId)
}

export async function listUpcomingMaintenance(
	projectId: string,
	limit?: number,
): Promise<MaintenanceModel[]> {
	return maintenanceRepository.findUpcomingByProjectId(projectId, limit)
}

export async function updateMaintenance(
	id: string,
	input: UpdateMaintenanceInput,
): Promise<MaintenanceModel> {
	return maintenanceRepository.update(id, input)
}

export async function deleteMaintenance(id: string): Promise<void> {
	await maintenanceRepository.delete(id)
}

export async function setMaintenanceChecks(
	maintenanceId: string,
	checkIds: string[],
): Promise<void> {
	await maintenanceRepository.setCheckIds(maintenanceId, checkIds)
}

export async function getMaintenanceCheckIds(
	maintenanceId: string,
): Promise<string[]> {
	return maintenanceRepository.getCheckIds(maintenanceId)
}
