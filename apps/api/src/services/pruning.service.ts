import { logger } from "../lib/logger.js"
import { type TierName, getTierLimits } from "../lib/tiers.js"
import { cronJobRepository } from "../repositories/cron-job.repository.js"
import { organizationRepository } from "../repositories/organization.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"

export type PruneResult = {
	cronJobsProcessed: number
	pingsDeleted: number
}

export async function pruneAllPings(): Promise<PruneResult> {
	const cronJobIds = await cronJobRepository.findAllCronJobIds()
	let totalDeleted = 0

	for (const cronJobId of cronJobIds) {
		try {
			const deleted = await pruneCronJobPings(cronJobId)
			totalDeleted += deleted
		} catch (err) {
			logger.error({ err, cronJobId }, "Pruning failed for cron job")
		}
	}

	return {
		cronJobsProcessed: cronJobIds.length,
		pingsDeleted: totalDeleted,
	}
}

async function pruneCronJobPings(cronJobId: string): Promise<number> {
	const org = await organizationRepository.findByCronJobId(cronJobId)
	if (!org) return 0

	const limits = getTierLimits(org.plan as TierName)
	let deleted = 0

	// Delete pings older than retention days
	const cutoffDate = new Date()
	cutoffDate.setDate(cutoffDate.getDate() - limits.pingRetentionDays)
	deleted += await pingRepository.deleteOlderThan(cronJobId, cutoffDate)

	// Delete pings exceeding count limit
	deleted += await pingRepository.deleteExcessPings(
		cronJobId,
		limits.pingHistoryPerCronJob,
	)

	return deleted
}
