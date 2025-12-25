import {
	CheckStatus,
	type PingType,
	type ScheduleType,
	prisma,
} from "@haspulse/db"
import { calculateNextExpected } from "../lib/schedule.js"
import type { CheckModel } from "../services/check.service.js"

type UpdateOnPingData = {
	type: PingType
	timestamp: Date
}

type CreateCheckData = {
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

type UpdateCheckData = {
	name?: string
	slug?: string | null
	scheduleType?: ScheduleType
	scheduleValue?: string
	graceSeconds?: number
	timezone?: string | null
	alertOnRecovery?: boolean
	reminderIntervalHours?: number | null
}

type RawCheck = {
	id: string
	project_id: string
	name: string
	slug: string | null
	schedule_type: "PERIOD" | "CRON"
	schedule_value: string
	grace_seconds: number
	timezone: string | null
	status: string
	last_ping_at: Date | null
	last_started_at: Date | null
	next_expected_at: Date | null
	last_alert_at: Date | null
	alert_on_recovery: boolean
	reminder_interval_hours: number | null
	created_at: Date
	updated_at: Date
}

function rawToCheckModel(raw: RawCheck): CheckModel {
	return {
		id: raw.id,
		projectId: raw.project_id,
		name: raw.name,
		slug: raw.slug,
		scheduleType: raw.schedule_type,
		scheduleValue: raw.schedule_value,
		graceSeconds: raw.grace_seconds,
		timezone: raw.timezone,
		status: raw.status as CheckStatus,
		lastPingAt: raw.last_ping_at,
		lastStartedAt: raw.last_started_at,
		nextExpectedAt: raw.next_expected_at,
		lastAlertAt: raw.last_alert_at,
		alertOnRecovery: raw.alert_on_recovery,
		reminderIntervalHours: raw.reminder_interval_hours,
		createdAt: raw.created_at,
		updatedAt: raw.updated_at,
	}
}

function toCheckModel(check: {
	id: string
	projectId: string
	name: string
	slug: string | null
	scheduleType: "PERIOD" | "CRON"
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
}): CheckModel {
	return {
		id: check.id,
		projectId: check.projectId,
		name: check.name,
		slug: check.slug,
		scheduleType: check.scheduleType,
		scheduleValue: check.scheduleValue,
		graceSeconds: check.graceSeconds,
		timezone: check.timezone,
		status: check.status,
		lastPingAt: check.lastPingAt,
		lastStartedAt: check.lastStartedAt,
		nextExpectedAt: check.nextExpectedAt,
		lastAlertAt: check.lastAlertAt,
		alertOnRecovery: check.alertOnRecovery,
		reminderIntervalHours: check.reminderIntervalHours,
		createdAt: check.createdAt,
		updatedAt: check.updatedAt,
	}
}

export const checkRepository = {
	async existsById(id: string): Promise<boolean> {
		const count = await prisma.check.count({ where: { id } })
		return count > 0
	},

	async findById(id: string): Promise<CheckModel | null> {
		const check = await prisma.check.findUnique({ where: { id } })
		return check ? toCheckModel(check) : null
	},

	async findIdBySlug(
		projectSlug: string,
		checkSlug: string,
	): Promise<string | null> {
		const check = await prisma.check.findFirst({
			where: {
				slug: checkSlug,
				project: { slug: projectSlug },
			},
			select: { id: true },
		})
		return check?.id ?? null
	},

	async updateOnPing(
		checkId: string,
		data: UpdateOnPingData,
	): Promise<{ wasDown: boolean; check: CheckModel }> {
		const check = await prisma.check.findUnique({
			where: { id: checkId },
		})
		if (!check) {
			throw new Error(`Check not found: ${checkId}`)
		}

		const wasDown = check.status === CheckStatus.DOWN

		const updateData: {
			lastPingAt?: Date
			lastStartedAt?: Date
			status?: CheckStatus
			nextExpectedAt?: Date
		} = {}

		if (data.type === "START") {
			updateData.lastStartedAt = data.timestamp
		} else {
			updateData.lastPingAt = data.timestamp
			updateData.nextExpectedAt = calculateNextExpected(
				check.scheduleType,
				check.scheduleValue,
				data.timestamp,
				check.timezone,
			)
		}

		if (data.type === "SUCCESS" || data.type === "FAIL") {
			if (
				check.status === CheckStatus.DOWN ||
				check.status === CheckStatus.NEW ||
				check.status === CheckStatus.LATE
			) {
				updateData.status = CheckStatus.UP
			}
		}

		const updated = await prisma.check.update({
			where: { id: checkId },
			data: updateData,
		})

		return { wasDown, check: toCheckModel(updated) }
	},

	async create(data: CreateCheckData): Promise<CheckModel> {
		const check = await prisma.check.create({
			data: {
				projectId: data.projectId,
				name: data.name,
				slug: data.slug,
				scheduleType: data.scheduleType,
				scheduleValue: data.scheduleValue,
				graceSeconds: data.graceSeconds ?? 300,
				timezone: data.timezone,
				alertOnRecovery: data.alertOnRecovery ?? true,
				reminderIntervalHours: data.reminderIntervalHours,
			},
		})
		return toCheckModel(check)
	},

	async findByProjectId(projectId: string): Promise<CheckModel[]> {
		const checks = await prisma.check.findMany({
			where: { projectId },
			orderBy: { createdAt: "desc" },
		})
		return checks.map(toCheckModel)
	},

	async findByProjectIdPaginated(
		projectId: string,
		page: number,
		limit: number,
		filters?: { search?: string; status?: CheckStatus },
	): Promise<{ data: CheckModel[]; total: number }> {
		const where: {
			projectId: string
			status?: CheckStatus
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

		const [checks, total] = await Promise.all([
			prisma.check.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.check.count({ where }),
		])
		return { data: checks.map(toCheckModel), total }
	},

	async update(id: string, data: UpdateCheckData): Promise<CheckModel> {
		const check = await prisma.check.update({
			where: { id },
			data,
		})
		return toCheckModel(check)
	},

	async delete(id: string): Promise<void> {
		await prisma.check.delete({ where: { id } })
	},

	async pause(id: string): Promise<CheckModel> {
		const check = await prisma.check.update({
			where: { id },
			data: { status: CheckStatus.PAUSED },
		})
		return toCheckModel(check)
	},

	async resume(id: string): Promise<CheckModel> {
		const check = await prisma.check.update({
			where: { id },
			data: { status: CheckStatus.NEW },
		})
		return toCheckModel(check)
	},

	async slugExistsInProject(projectId: string, slug: string): Promise<boolean> {
		const count = await prisma.check.count({
			where: { projectId, slug },
		})
		return count > 0
	},

	async findLateChecks(now: Date): Promise<CheckModel[]> {
		const checks = await prisma.check.findMany({
			where: {
				status: CheckStatus.UP,
				nextExpectedAt: { lt: now },
			},
		})
		return checks.map(toCheckModel)
	},

	async findDownChecks(now: Date): Promise<CheckModel[]> {
		const checks = await prisma.$queryRaw<Array<RawCheck>>`
			SELECT * FROM checks
			WHERE status = 'LATE'
				AND next_expected_at IS NOT NULL
				AND next_expected_at + (grace_seconds * INTERVAL '1 second') < ${now}
		`
		return checks.map(rawToCheckModel)
	},

	async findStillDownChecks(now: Date): Promise<CheckModel[]> {
		const checks = await prisma.$queryRaw<Array<RawCheck>>`
			SELECT * FROM checks
			WHERE status = 'DOWN'
				AND reminder_interval_hours IS NOT NULL
				AND last_alert_at IS NOT NULL
				AND last_alert_at + (reminder_interval_hours * INTERVAL '1 hour') < ${now}
		`
		return checks.map(rawToCheckModel)
	},

	async updateStatus(id: string, status: CheckStatus): Promise<CheckModel> {
		const check = await prisma.check.update({
			where: { id },
			data: { status },
		})
		return toCheckModel(check)
	},

	async updateLastAlertAt(id: string, timestamp: Date): Promise<void> {
		await prisma.check.update({
			where: { id },
			data: { lastAlertAt: timestamp },
		})
	},

	async getChannelIds(checkId: string): Promise<string[]> {
		const relations = await prisma.checkChannel.findMany({
			where: { checkId },
			select: { channelId: true },
		})
		return relations.map((r: { channelId: string }) => r.channelId)
	},

	async setChannelIds(checkId: string, channelIds: string[]): Promise<void> {
		await prisma.$transaction([
			prisma.checkChannel.deleteMany({ where: { checkId } }),
			prisma.checkChannel.createMany({
				data: channelIds.map((channelId) => ({ checkId, channelId })),
			}),
		])
	},

	async findActiveChecks(): Promise<CheckModel[]> {
		const checks = await prisma.check.findMany({
			where: {
				status: { not: CheckStatus.PAUSED },
			},
		})
		return checks.map(toCheckModel)
	},

	async findAllCheckIds(): Promise<string[]> {
		const checks = await prisma.check.findMany({
			select: { id: true },
		})
		return checks.map((c: { id: string }) => c.id)
	},
}
