import type { PingType } from "@haspulse/db"
import { logger } from "../lib/logger.js"
import { checkRepository } from "../repositories/check.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"
import { createPaginatedResult } from "../routes/v1/shared/schemas.js"
import { triggerAlert } from "./alert.service.js"
import {
	calculateDurationFromStart,
	updateRollingStats,
} from "./duration.service.js"

export type PingModel = {
	id: string
	checkId: string
	type: PingType
	body: string | null
	sourceIp: string
	durationMs: number | null
	startPingId: string | null
	createdAt: Date
}

export type RecordPingInput = {
	checkId: string
	type: PingType
	body: string | null
	sourceIp: string
}

export async function recordPing(input: RecordPingInput): Promise<PingModel> {
	let durationMs: number | null = null
	let startPingId: string | null = null

	if (input.type !== "START") {
		const durationResult = await calculateDurationFromStart(
			input.checkId,
			new Date(),
		)
		if (durationResult) {
			durationMs = durationResult.durationMs
			startPingId = durationResult.startPingId
		}
	}

	const ping = await pingRepository.create({
		checkId: input.checkId,
		type: input.type,
		body: input.body,
		sourceIp: input.sourceIp,
		durationMs,
		startPingId,
	})

	if (durationMs !== null) {
		updateRollingStats(input.checkId, durationMs).catch((err) => {
			logger.error(
				{ err, checkId: input.checkId },
				"Failed to update duration stats",
			)
		})
	}

	const { wasDown, check } = await checkRepository.updateOnPing(input.checkId, {
		type: input.type,
		timestamp: ping.createdAt,
	})

	if (wasDown && input.type !== "START" && check.alertOnRecovery) {
		try {
			const result = await triggerAlert("check.up", check)
			if (result.sent) {
				await checkRepository.updateLastAlertAt(check.id, ping.createdAt)
			}
		} catch (err) {
			logger.error(
				{ err, checkId: check.id },
				"Failed to trigger recovery alert",
			)
		}
	}

	return ping
}

export async function listPingsByCheck(
	checkId: string,
	limit = 50,
): Promise<PingModel[]> {
	return pingRepository.findByCheckId(checkId, limit)
}

export async function listPingsByCheckPaginated(
	checkId: string,
	page: number,
	limit: number,
) {
	const result = await pingRepository.findByCheckIdPaginated(
		checkId,
		page,
		limit,
	)
	return createPaginatedResult(result.data, result.total, page, limit)
}
