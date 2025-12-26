import type { PingType } from "@haspulse/db"
import { logger } from "../lib/logger.js"
import { checkRepository } from "../repositories/check.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"
import { triggerAlert } from "./alert.service.js"

export type PingModel = {
	id: string
	checkId: string
	type: PingType
	body: string | null
	sourceIp: string
	createdAt: Date
}

export type RecordPingInput = {
	checkId: string
	type: PingType
	body: string | null
	sourceIp: string
}

export async function recordPing(input: RecordPingInput): Promise<PingModel> {
	const ping = await pingRepository.create({
		checkId: input.checkId,
		type: input.type,
		body: input.body,
		sourceIp: input.sourceIp,
	})

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
