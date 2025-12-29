import {
	type AnomalySensitivity,
	MonitorStatus,
	type PingType,
	type ScheduleType,
	prisma,
} from "@haspulse/db"
import { calculateNextExpected } from "../lib/schedule.js"
import type { CronJobModel } from "../services/cron-job.service.js"

type UpdateOnPingData = {
	type: PingType
	timestamp: Date
}

type CreateCronJobData = {
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

type UpdateCronJobData = {
	name?: string
	slug?: string | null
	scheduleType?: ScheduleType
	scheduleValue?: string
	graceSeconds?: number
	alertOnRecovery?: boolean
	reminderIntervalHours?: number | null
	anomalySensitivity?: AnomalySensitivity
}

type RawCronJob = {
	id: string
	project_id: string
	name: string
	slug: string | null
	schedule_type: "PERIOD" | "CRON"
	schedule_value: string
	grace_seconds: number
	status: string
	last_ping_at: Date | null
	last_started_at: Date | null
	next_expected_at: Date | null
	last_alert_at: Date | null
	alert_on_recovery: boolean
	reminder_interval_hours: number | null
	anomaly_sensitivity: AnomalySensitivity
	created_at: Date
	updated_at: Date
}

function rawToCronJobModel(raw: RawCronJob): CronJobModel {
	return {
		id: raw.id,
		projectId: raw.project_id,
		name: raw.name,
		slug: raw.slug,
		scheduleType: raw.schedule_type,
		scheduleValue: raw.schedule_value,
		graceSeconds: raw.grace_seconds,
		status: raw.status as MonitorStatus,
		lastPingAt: raw.last_ping_at,
		lastStartedAt: raw.last_started_at,
		nextExpectedAt: raw.next_expected_at,
		lastAlertAt: raw.last_alert_at,
		alertOnRecovery: raw.alert_on_recovery,
		reminderIntervalHours: raw.reminder_interval_hours,
		anomalySensitivity: raw.anomaly_sensitivity,
		createdAt: raw.created_at,
		updatedAt: raw.updated_at,
	}
}

function toCronJobModel(cronJob: {
	id: string
	projectId: string
	name: string
	slug: string | null
	scheduleType: "PERIOD" | "CRON"
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
}): CronJobModel {
	return {
		id: cronJob.id,
		projectId: cronJob.projectId,
		name: cronJob.name,
		slug: cronJob.slug,
		scheduleType: cronJob.scheduleType,
		scheduleValue: cronJob.scheduleValue,
		graceSeconds: cronJob.graceSeconds,
		status: cronJob.status,
		lastPingAt: cronJob.lastPingAt,
		lastStartedAt: cronJob.lastStartedAt,
		nextExpectedAt: cronJob.nextExpectedAt,
		lastAlertAt: cronJob.lastAlertAt,
		alertOnRecovery: cronJob.alertOnRecovery,
		reminderIntervalHours: cronJob.reminderIntervalHours,
		anomalySensitivity: cronJob.anomalySensitivity,
		createdAt: cronJob.createdAt,
		updatedAt: cronJob.updatedAt,
	}
}

export const cronJobRepository = {
	async existsById(id: string): Promise<boolean> {
		const count = await prisma.cronJob.count({ where: { id } })
		return count > 0
	},

	async findById(id: string): Promise<CronJobModel | null> {
		const cronJob = await prisma.cronJob.findUnique({ where: { id } })
		return cronJob ? toCronJobModel(cronJob) : null
	},

	async findIdBySlug(
		projectSlug: string,
		cronJobSlug: string,
	): Promise<string | null> {
		const cronJob = await prisma.cronJob.findFirst({
			where: {
				slug: cronJobSlug,
				project: { slug: projectSlug },
			},
			select: { id: true },
		})
		return cronJob?.id ?? null
	},

	async findIdBySlugInProject(
		projectId: string,
		slug: string,
	): Promise<string | null> {
		const cronJob = await prisma.cronJob.findFirst({
			where: { projectId, slug },
			select: { id: true },
		})
		return cronJob?.id ?? null
	},

	async updateOnPing(
		cronJobId: string,
		data: UpdateOnPingData,
	): Promise<{ wasDown: boolean; cronJob: CronJobModel }> {
		const cronJob = await prisma.cronJob.findUnique({
			where: { id: cronJobId },
		})
		if (!cronJob) {
			throw new Error(`CronJob not found: ${cronJobId}`)
		}

		const wasDown = cronJob.status === MonitorStatus.DOWN

		const updateData: {
			lastPingAt?: Date
			lastStartedAt?: Date
			status?: MonitorStatus
			nextExpectedAt?: Date
		} = {}

		if (data.type === "START") {
			updateData.lastStartedAt = data.timestamp
		} else {
			updateData.lastPingAt = data.timestamp
			updateData.nextExpectedAt = calculateNextExpected(
				cronJob.scheduleType,
				cronJob.scheduleValue,
				data.timestamp,
			)
		}

		// Only SUCCESS transitions to UP, not FAIL
		if (data.type === "SUCCESS") {
			if (
				cronJob.status === MonitorStatus.DOWN ||
				cronJob.status === MonitorStatus.NEW ||
				cronJob.status === MonitorStatus.LATE
			) {
				updateData.status = MonitorStatus.UP
			}
		}

		const updated = await prisma.cronJob.update({
			where: { id: cronJobId },
			data: updateData,
		})

		return { wasDown, cronJob: toCronJobModel(updated) }
	},

	async create(data: CreateCronJobData): Promise<CronJobModel> {
		const cronJob = await prisma.cronJob.create({
			data: {
				projectId: data.projectId,
				name: data.name,
				slug: data.slug,
				scheduleType: data.scheduleType,
				scheduleValue: data.scheduleValue,
				graceSeconds: data.graceSeconds ?? 300,
				alertOnRecovery: data.alertOnRecovery ?? true,
				reminderIntervalHours: data.reminderIntervalHours,
				anomalySensitivity: data.anomalySensitivity,
			},
		})
		return toCronJobModel(cronJob)
	},

	async findByProjectId(projectId: string): Promise<CronJobModel[]> {
		const cronJobs = await prisma.cronJob.findMany({
			where: { projectId },
			orderBy: { createdAt: "desc" },
		})
		return cronJobs.map(toCronJobModel)
	},

	async findByProjectIdPaginated(
		projectId: string,
		page: number,
		limit: number,
		filters?: { search?: string; status?: MonitorStatus },
	): Promise<{ data: CronJobModel[]; total: number }> {
		const where: {
			projectId: string
			status?: MonitorStatus
			OR?: Array<
				| { name: { contains: string; mode: "insensitive" } }
				| { slug: { contains: string; mode: "insensitive" } }
			>
		} = { projectId }

		if (filters?.status) {
			where.status = filters.status
		}

		if (filters?.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: "insensitive" } },
				{ slug: { contains: filters.search, mode: "insensitive" } },
			]
		}

		const [cronJobs, total] = await Promise.all([
			prisma.cronJob.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.cronJob.count({ where }),
		])
		return { data: cronJobs.map(toCronJobModel), total }
	},

	async update(id: string, data: UpdateCronJobData): Promise<CronJobModel> {
		const cronJob = await prisma.cronJob.update({
			where: { id },
			data,
		})
		return toCronJobModel(cronJob)
	},

	async delete(id: string): Promise<void> {
		await prisma.cronJob.delete({ where: { id } })
	},

	async pause(id: string): Promise<CronJobModel> {
		const cronJob = await prisma.cronJob.update({
			where: { id },
			data: { status: MonitorStatus.PAUSED },
		})
		return toCronJobModel(cronJob)
	},

	async resume(id: string): Promise<CronJobModel> {
		const cronJob = await prisma.cronJob.update({
			where: { id },
			data: { status: MonitorStatus.NEW },
		})
		return toCronJobModel(cronJob)
	},

	async slugExistsInProject(projectId: string, slug: string): Promise<boolean> {
		const count = await prisma.cronJob.count({
			where: { projectId, slug },
		})
		return count > 0
	},

	async findLateCronJobs(now: Date): Promise<CronJobModel[]> {
		const cronJobs = await prisma.cronJob.findMany({
			where: {
				status: MonitorStatus.UP,
				nextExpectedAt: { lt: now },
			},
		})
		return cronJobs.map(toCronJobModel)
	},

	async findDownCronJobs(now: Date): Promise<CronJobModel[]> {
		const cronJobs = await prisma.$queryRaw<Array<RawCronJob>>`
			SELECT * FROM cron_jobs
			WHERE status = 'LATE'
				AND next_expected_at IS NOT NULL
				AND next_expected_at + (grace_seconds * INTERVAL '1 second') < ${now}
		`
		return cronJobs.map(rawToCronJobModel)
	},

	async findStillDownCronJobs(now: Date): Promise<CronJobModel[]> {
		const cronJobs = await prisma.$queryRaw<Array<RawCronJob>>`
			SELECT * FROM cron_jobs
			WHERE status = 'DOWN'
				AND reminder_interval_hours IS NOT NULL
				AND last_alert_at IS NOT NULL
				AND last_alert_at + (reminder_interval_hours * INTERVAL '1 hour') < ${now}
		`
		return cronJobs.map(rawToCronJobModel)
	},

	async updateStatus(id: string, status: MonitorStatus): Promise<CronJobModel> {
		const cronJob = await prisma.cronJob.update({
			where: { id },
			data: { status },
		})
		return toCronJobModel(cronJob)
	},

	async updateLastAlertAt(id: string, timestamp: Date): Promise<void> {
		await prisma.cronJob.update({
			where: { id },
			data: { lastAlertAt: timestamp },
		})
	},

	async updateNextExpectedAt(id: string, timestamp: Date): Promise<void> {
		await prisma.cronJob.update({
			where: { id },
			data: { nextExpectedAt: timestamp },
		})
	},

	async getChannelIds(cronJobId: string): Promise<string[]> {
		const relations = await prisma.cronJobChannel.findMany({
			where: { cronJobId },
			select: { channelId: true },
		})
		return relations.map((r: { channelId: string }) => r.channelId)
	},

	async setChannelIds(cronJobId: string, channelIds: string[]): Promise<void> {
		await prisma.$transaction([
			prisma.cronJobChannel.deleteMany({ where: { cronJobId } }),
			prisma.cronJobChannel.createMany({
				data: channelIds.map((channelId) => ({ cronJobId, channelId })),
			}),
		])
	},

	async findActiveCronJobs(): Promise<CronJobModel[]> {
		const cronJobs = await prisma.cronJob.findMany({
			where: {
				status: { not: MonitorStatus.PAUSED },
			},
		})
		return cronJobs.map(toCronJobModel)
	},

	async findAllCronJobIds(): Promise<string[]> {
		const cronJobs = await prisma.cronJob.findMany({
			select: { id: true },
		})
		return cronJobs.map((c: { id: string }) => c.id)
	},
}
