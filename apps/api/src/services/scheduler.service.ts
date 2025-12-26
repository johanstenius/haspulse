import { CheckStatus } from "@haspulse/db"
import { logger } from "../lib/logger.js"
import { checkRepository } from "../repositories/check.repository.js"
import { organizationRepository } from "../repositories/organization.repository.js"
import { triggerAlert } from "./alert.service.js"
import {
	createIncident,
	findActiveIncidentForCheck,
} from "./incident.service.js"
import { pruneAllPings } from "./pruning.service.js"
import { recordCheckStatus } from "./stats.service.js"

const SCHEDULER_INTERVAL_MS = 60_000
const PRUNE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
let lastPruneRun = 0

export function startScheduler(): void {
	logger.info({ intervalMs: SCHEDULER_INTERVAL_MS }, "Starting scheduler")
	setInterval(async () => {
		try {
			await runSchedulerTick()
		} catch (err) {
			logger.error({ err }, "Scheduler tick failed")
		}
	}, SCHEDULER_INTERVAL_MS)
	// Run immediately on startup
	runSchedulerTick().catch((err) => {
		logger.error({ err }, "Initial scheduler tick failed")
	})
}

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
			logger.error({ err, checkId: check.id }, "Alert failed")
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
			logger.error({ err, checkId: check.id }, "Auto-incident failed")
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
			logger.error({ err, checkId: check.id }, "Reminder failed")
		}
	}

	// Record uptime stats for all active checks
	await recordUptimeStats()

	// Prune old pings hourly
	const nowMs = Date.now()
	if (nowMs - lastPruneRun > PRUNE_INTERVAL_MS) {
		try {
			const result = await pruneAllPings()
			logger.info(
				{
					pingsDeleted: result.pingsDeleted,
					checksProcessed: result.checksProcessed,
				},
				"Pruning complete",
			)
			lastPruneRun = nowMs
		} catch (err) {
			logger.error({ err }, "Pruning failed")
		}
	}
}

async function recordUptimeStats(): Promise<void> {
	const activeChecks = await checkRepository.findActiveChecks()

	for (const check of activeChecks) {
		try {
			await recordCheckStatus(check.id, check.status)
		} catch (err) {
			logger.error({ err, checkId: check.id }, "Stats recording failed")
		}
	}
}
