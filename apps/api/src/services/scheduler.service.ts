import { CheckStatus } from "@haspulse/db"
import { checkRepository } from "../repositories/check.repository.js"
import { organizationRepository } from "../repositories/organization.repository.js"
import { triggerAlert } from "./alert.service.js"
import {
	createIncident,
	findActiveIncidentForCheck,
} from "./incident.service.js"
import { pruneAllPings } from "./pruning.service.js"
import { recordCheckStatus } from "./stats.service.js"

const PRUNE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
let lastPruneRun = 0

export async function runSchedulerTick(): Promise<void> {
	const now = new Date()

	const lateChecks = await checkRepository.findLateChecks(now)
	for (const check of lateChecks) {
		await checkRepository.updateStatus(check.id, CheckStatus.LATE)
	}

	const downChecks = await checkRepository.findDownChecks(now)
	for (const check of downChecks) {
		await checkRepository.updateStatus(check.id, CheckStatus.DOWN)
		const updated = { ...check, status: CheckStatus.DOWN }

		try {
			const result = await triggerAlert("check.down", updated)
			if (result.sent) {
				await checkRepository.updateLastAlertAt(check.id, now)
			}
		} catch (err) {
			console.error(`[scheduler] Alert failed for ${check.id}:`, err)
		}

		try {
			const org = await organizationRepository.findByCheckId(check.id)
			if (org?.autoCreateIncidents) {
				const existingIncident = await findActiveIncidentForCheck(check.id)
				if (!existingIncident) {
					await createIncident({
						projectId: check.projectId,
						title: `${check.name} is down`,
						impact: "MAJOR",
						autoCreated: true,
						checkIds: [check.id],
					})
				}
			}
		} catch (err) {
			console.error(`[scheduler] Auto-incident failed for ${check.id}:`, err)
		}
	}

	const stillDownChecks = await checkRepository.findStillDownChecks(now)
	for (const check of stillDownChecks) {
		try {
			const result = await triggerAlert("check.still_down", check)
			if (result.sent) {
				await checkRepository.updateLastAlertAt(check.id, now)
			}
		} catch (err) {
			console.error(`[scheduler] Reminder failed for ${check.id}:`, err)
		}
	}

	// Record uptime stats for all active checks
	await recordUptimeStats()

	// Prune old pings hourly
	const nowMs = Date.now()
	if (nowMs - lastPruneRun > PRUNE_INTERVAL_MS) {
		try {
			const result = await pruneAllPings()
			console.log(
				`[pruning] Deleted ${result.pingsDeleted} pings from ${result.checksProcessed} checks`,
			)
			lastPruneRun = nowMs
		} catch (err) {
			console.error("[pruning] Failed:", err)
		}
	}
}

async function recordUptimeStats(): Promise<void> {
	const activeChecks = await checkRepository.findActiveChecks()

	for (const check of activeChecks) {
		try {
			await recordCheckStatus(check.id, check.status)
		} catch (err) {
			console.error(`[scheduler] Stats recording failed for ${check.id}:`, err)
		}
	}
}
