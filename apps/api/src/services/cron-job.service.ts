import type {
	AnomalySensitivity,
	MonitorStatus,
	ScheduleType,
} from "@haspulse/db"
import { forbidden, notFound } from "../lib/errors.js"
import { cronJobRepository } from "../repositories/cron-job.repository.js"

export type CronJobModel = {
	id: string
	projectId: string
	name: string
	slug: string | null
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds: number
	status: MonitorStatus
	lastPingAt: Date | null
	lastStartedAt: Date | null
	nextExpectedAt: Date | null
	lastAlertAt: Date | null
	alertOnRecovery: boolean
	reminderIntervalHours: number | null
	anomalySensitivity: AnomalySensitivity
	createdAt: Date
	updatedAt: Date
}

export type CreateCronJobInput = {
	projectId: string
	name: string
	slug?: string
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds?: number
	alertOnRecovery?: boolean
	reminderIntervalHours?: number
	anomalySensitivity?: AnomalySensitivity
}

export type UpdateCronJobInput = {
	name?: string
	slug?: string | null
	scheduleType?: ScheduleType
	scheduleValue?: string
	graceSeconds?: number
	alertOnRecovery?: boolean
	reminderIntervalHours?: number | null
	anomalySensitivity?: AnomalySensitivity
}

export async function getCronJobById(id: string): Promise<CronJobModel | null> {
	return cronJobRepository.findById(id)
}

export async function createCronJob(
	input: CreateCronJobInput,
): Promise<CronJobModel> {
	return cronJobRepository.create(input)
}

export async function listCronJobsByProject(
	projectId: string,
): Promise<CronJobModel[]> {
	return cronJobRepository.findByProjectId(projectId)
}

export async function listCronJobsByProjectPaginated(
	projectId: string,
	page: number,
	limit: number,
	filters?: { search?: string; status?: MonitorStatus },
): Promise<{ data: CronJobModel[]; total: number }> {
	return cronJobRepository.findByProjectIdPaginated(
		projectId,
		page,
		limit,
		filters,
	)
}

export async function updateCronJob(
	id: string,
	input: UpdateCronJobInput,
): Promise<CronJobModel> {
	return cronJobRepository.update(id, input)
}

export async function deleteCronJob(id: string): Promise<void> {
	await cronJobRepository.delete(id)
}

export async function pauseCronJob(id: string): Promise<CronJobModel> {
	return cronJobRepository.pause(id)
}

export async function resumeCronJob(id: string): Promise<CronJobModel> {
	return cronJobRepository.resume(id)
}

export async function getCronJobForProject(
	cronJobId: string,
	projectId: string,
): Promise<CronJobModel> {
	const cronJob = await cronJobRepository.findById(cronJobId)
	if (!cronJob) {
		throw notFound("Cron job not found")
	}
	if (cronJob.projectId !== projectId) {
		throw forbidden("Cron job does not belong to this project")
	}
	return cronJob
}

export async function slugExistsInProject(
	projectId: string,
	slug: string,
): Promise<boolean> {
	return cronJobRepository.slugExistsInProject(projectId, slug)
}

export async function getCronJobChannelIds(
	cronJobId: string,
): Promise<string[]> {
	return cronJobRepository.getChannelIds(cronJobId)
}

export async function setCronJobChannelIds(
	cronJobId: string,
	channelIds: string[],
): Promise<void> {
	await cronJobRepository.setChannelIds(cronJobId, channelIds)
}
