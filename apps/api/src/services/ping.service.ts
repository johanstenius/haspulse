import type { PingType } from "@haspulse/db"
import { logger } from "../lib/logger.js"
import { cronJobRepository } from "../repositories/cron-job.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"
import { createPaginatedResult } from "../routes/v1/shared/schemas.js"
import { triggerAlert } from "./alert.service.js"
import {
	calculateDurationFromStart,
	updateRollingStats,
} from "./duration.service.js"
import { incidentService } from "./incident.service.js"

export type PingModel = {
	id: string
	cronJobId: string
	type: PingType
	body: string | null
	sourceIp: string
	durationMs: number | null
	startPingId: string | null
	createdAt: Date
}

export type RecordPingInput = {
	cronJobId: string
	type: PingType
	body: string | null
	sourceIp: string
}

export async function recordPing(input: RecordPingInput): Promise<PingModel> {
	let durationMs: number | null = null
	let startPingId: string | null = null

	if (input.type !== "START") {
		const durationResult = await calculateDurationFromStart(
			input.cronJobId,
			new Date(),
		)
		if (durationResult) {
			durationMs = durationResult.durationMs
			startPingId = durationResult.startPingId
		}
	}

	const ping = await pingRepository.create({
		cronJobId: input.cronJobId,
		type: input.type,
		body: input.body,
		sourceIp: input.sourceIp,
		durationMs,
		startPingId,
	})

	if (durationMs !== null) {
		updateRollingStats(input.cronJobId, durationMs).catch((err) => {
			logger.error(
				{ err, cronJobId: input.cronJobId },
				"Failed to update duration stats",
			)
		})
	}

	const { wasDown, cronJob } = await cronJobRepository.updateOnPing(
		input.cronJobId,
		{
			type: input.type,
			timestamp: ping.createdAt,
		},
	)

	// Trigger cronJob.fail alert on FAIL pings (with dedup)
	if (input.type === "FAIL") {
		try {
			const result = await triggerAlert("cronJob.fail", cronJob)
			if (result.sent) {
				await cronJobRepository.updateLastAlertAt(cronJob.id, ping.createdAt)
			}
		} catch (err) {
			logger.error(
				{ err, cronJobId: cronJob.id },
				"Failed to trigger fail alert",
			)
		}
	}

	// Recovery alert only on SUCCESS (not FAIL)
	if (wasDown && input.type === "SUCCESS" && cronJob.alertOnRecovery) {
		try {
			const result = await triggerAlert("cronJob.up", cronJob)
			if (result.sent) {
				await cronJobRepository.updateLastAlertAt(cronJob.id, ping.createdAt)
			}
		} catch (err) {
			logger.error(
				{ err, cronJobId: cronJob.id },
				"Failed to trigger recovery alert",
			)
		}
	}

	// Resolve auto-incident on recovery
	if (wasDown && input.type === "SUCCESS") {
		try {
			await incidentService.handleMonitorRecovered(
				cronJob.projectId,
				cronJob.name,
				cronJob.id,
				undefined,
			)
		} catch (err) {
			logger.error(
				{ err, cronJobId: cronJob.id },
				"Failed to resolve auto-incident",
			)
		}
	}

	return ping
}

export async function listPingsByCronJob(
	cronJobId: string,
	limit = 50,
): Promise<PingModel[]> {
	return pingRepository.findByCronJobId(cronJobId, limit)
}

export async function listPingsByCronJobPaginated(
	cronJobId: string,
	page: number,
	limit: number,
) {
	const result = await pingRepository.findByCronJobIdPaginated(
		cronJobId,
		page,
		limit,
	)
	return createPaginatedResult(result.data, result.total, page, limit)
}
