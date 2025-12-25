import type { CheckStatus, ScheduleType } from "@haspulse/db"
import { forbidden, notFound } from "../lib/errors.js"
import { checkRepository } from "../repositories/check.repository.js"

export type CheckModel = {
	id: string
	projectId: string
	name: string
	slug: string | null
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds: number
	timezone: string | null
	status: CheckStatus
	lastPingAt: Date | null
	lastStartedAt: Date | null
	nextExpectedAt: Date | null
	lastAlertAt: Date | null
	alertOnRecovery: boolean
	reminderIntervalHours: number | null
	createdAt: Date
	updatedAt: Date
}

export type CreateCheckInput = {
	projectId: string
	name: string
	slug?: string
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds?: number
	timezone?: string
	alertOnRecovery?: boolean
	reminderIntervalHours?: number
}

export type UpdateCheckInput = {
	name?: string
	slug?: string | null
	scheduleType?: ScheduleType
	scheduleValue?: string
	graceSeconds?: number
	timezone?: string | null
	alertOnRecovery?: boolean
	reminderIntervalHours?: number | null
}

export async function getCheckById(id: string): Promise<CheckModel | null> {
	return checkRepository.findById(id)
}

export async function createCheck(
	input: CreateCheckInput,
): Promise<CheckModel> {
	return checkRepository.create(input)
}

export async function listChecksByProject(
	projectId: string,
): Promise<CheckModel[]> {
	return checkRepository.findByProjectId(projectId)
}

export async function listChecksByProjectPaginated(
	projectId: string,
	page: number,
	limit: number,
): Promise<{ data: CheckModel[]; total: number }> {
	return checkRepository.findByProjectIdPaginated(projectId, page, limit)
}

export async function updateCheck(
	id: string,
	input: UpdateCheckInput,
): Promise<CheckModel> {
	return checkRepository.update(id, input)
}

export async function deleteCheck(id: string): Promise<void> {
	await checkRepository.delete(id)
}

export async function pauseCheck(id: string): Promise<CheckModel> {
	return checkRepository.pause(id)
}

export async function resumeCheck(id: string): Promise<CheckModel> {
	return checkRepository.resume(id)
}

export async function getCheckForProject(
	checkId: string,
	projectId: string,
): Promise<CheckModel> {
	const check = await checkRepository.findById(checkId)
	if (!check) {
		throw notFound("Check not found")
	}
	if (check.projectId !== projectId) {
		throw forbidden("Check does not belong to this project")
	}
	return check
}

export async function slugExistsInProject(
	projectId: string,
	slug: string,
): Promise<boolean> {
	return checkRepository.slugExistsInProject(projectId, slug)
}

export async function getCheckChannelIds(checkId: string): Promise<string[]> {
	return checkRepository.getChannelIds(checkId)
}

export async function setCheckChannelIds(
	checkId: string,
	channelIds: string[],
): Promise<void> {
	await checkRepository.setChannelIds(checkId, channelIds)
}
