import type { PingType } from "@haspulse/db"
import { checkRepository } from "../repositories/check.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"
import { triggerAlert } from "./alert.service.js"
import {
	createIncidentUpdate,
	findActiveIncidentForCheck,
} from "./incident.service.js"

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

	if (wasDown && input.type !== "START") {
		if (check.alertOnRecovery) {
			try {
				const result = await triggerAlert("check.up", check)
				if (result.sent) {
					await checkRepository.updateLastAlertAt(check.id, ping.createdAt)
				}
			} catch (err) {
				console.error("Failed to trigger recovery alert:", err)
			}
		}

		try {
			const activeIncident = await findActiveIncidentForCheck(input.checkId)
			if (activeIncident?.autoCreated) {
				await createIncidentUpdate({
					incidentId: activeIncident.id,
					status: "RESOLVED",
					message: `${check.name} has recovered`,
				})
			}
		} catch (err) {
			console.error("[ping] Failed to auto-resolve incident:", err)
		}
	}

	return ping
}

export async function resolveCheckId(
	identifier: { id: string } | { projectSlug: string; checkSlug: string },
): Promise<string | null> {
	if ("id" in identifier) {
		const exists = await checkRepository.existsById(identifier.id)
		return exists ? identifier.id : null
	}
	return checkRepository.findIdBySlug(
		identifier.projectSlug,
		identifier.checkSlug,
	)
}

export async function listPingsByCheck(
	checkId: string,
	limit = 50,
): Promise<PingModel[]> {
	return pingRepository.findByCheckId(checkId, limit)
}
