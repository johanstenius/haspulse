import { logger } from "../lib/logger.js"
import { type TierName, getTierLimits } from "../lib/tiers.js"
import { checkRepository } from "../repositories/check.repository.js"
import { organizationRepository } from "../repositories/organization.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"

export type PruneResult = {
	checksProcessed: number
	pingsDeleted: number
}

export async function pruneAllPings(): Promise<PruneResult> {
	const checkIds = await checkRepository.findAllCheckIds()
	let totalDeleted = 0

	for (const checkId of checkIds) {
		try {
			const deleted = await pruneCheckPings(checkId)
			totalDeleted += deleted
		} catch (err) {
			logger.error({ err, checkId }, "Pruning failed for check")
		}
	}

	return {
		checksProcessed: checkIds.length,
		pingsDeleted: totalDeleted,
	}
}

async function pruneCheckPings(checkId: string): Promise<number> {
	const org = await organizationRepository.findByCheckId(checkId)
	if (!org) return 0

	const limits = getTierLimits(org.plan as TierName)
	let deleted = 0

	// Delete pings older than retention days
	const cutoffDate = new Date()
	cutoffDate.setDate(cutoffDate.getDate() - limits.pingRetentionDays)
	deleted += await pingRepository.deleteOlderThan(checkId, cutoffDate)

	// Delete pings exceeding count limit
	deleted += await pingRepository.deleteExcessPings(
		checkId,
		limits.pingHistoryPerCheck,
	)

	return deleted
}
