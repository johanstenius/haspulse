import type { IncidentImpact, IncidentStatus } from "@haspulse/db"
import { incidentRepository } from "../repositories/incident.repository.js"

export type IncidentModel = {
	id: string
	projectId: string
	title: string
	status: IncidentStatus
	impact: IncidentImpact
	autoCreated: boolean
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

export type IncidentWithUpdatesModel = IncidentModel & {
	updates: IncidentUpdateModel[]
	checkIds: string[]
}

export type CreateIncidentInput = {
	projectId: string
	title: string
	status?: IncidentStatus
	impact?: IncidentImpact
	autoCreated?: boolean
	checkIds?: string[]
}

export type UpdateIncidentInput = {
	title?: string
	status?: IncidentStatus
	impact?: IncidentImpact
}

export type CreateIncidentUpdateInput = {
	incidentId: string
	status: IncidentStatus
	message: string
}

export async function createIncident(
	input: CreateIncidentInput,
): Promise<IncidentModel> {
	const incident = await incidentRepository.create({
		projectId: input.projectId,
		title: input.title,
		status: input.status ?? "INVESTIGATING",
		impact: input.impact ?? "MINOR",
		autoCreated: input.autoCreated,
	})

	if (input.checkIds?.length) {
		for (const checkId of input.checkIds) {
			await incidentRepository.addCheck(incident.id, checkId)
		}
	}

	return incident
}

export async function getIncidentById(
	id: string,
): Promise<IncidentModel | null> {
	return incidentRepository.findById(id)
}

export async function getIncidentWithUpdates(
	id: string,
): Promise<IncidentWithUpdatesModel | null> {
	return incidentRepository.findByIdWithUpdates(id)
}

export async function listIncidentsByProject(
	projectId: string,
	options?: { limit?: number; status?: IncidentStatus },
): Promise<IncidentModel[]> {
	return incidentRepository.findByProjectId(projectId, options)
}

export async function listIncidentsByProjectPaginated(
	projectId: string,
	page: number,
	limit: number,
	status?: IncidentStatus,
): Promise<{ data: IncidentModel[]; total: number }> {
	return incidentRepository.findByProjectIdPaginated(
		projectId,
		page,
		limit,
		status,
	)
}

export async function listActiveIncidents(
	projectId: string,
): Promise<IncidentModel[]> {
	return incidentRepository.findActiveByProjectId(projectId)
}

export async function findActiveIncidentForCheck(
	checkId: string,
): Promise<IncidentModel | null> {
	return incidentRepository.findActiveByCheckId(checkId)
}

export async function updateIncident(
	id: string,
	input: UpdateIncidentInput,
): Promise<IncidentModel> {
	return incidentRepository.update(id, input)
}

export async function deleteIncident(id: string): Promise<void> {
	await incidentRepository.delete(id)
}

export async function addIncidentCheck(
	incidentId: string,
	checkId: string,
): Promise<void> {
	await incidentRepository.addCheck(incidentId, checkId)
}

export async function removeIncidentCheck(
	incidentId: string,
	checkId: string,
): Promise<void> {
	await incidentRepository.removeCheck(incidentId, checkId)
}

export async function createIncidentUpdate(
	input: CreateIncidentUpdateInput,
): Promise<IncidentUpdateModel> {
	return incidentRepository.createUpdate(input)
}

export async function listIncidentUpdates(
	incidentId: string,
): Promise<IncidentUpdateModel[]> {
	return incidentRepository.getUpdates(incidentId)
}
