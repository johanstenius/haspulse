import { organizationRepository } from "../repositories/organization.repository.js"
import type { TierName } from "./tiers.js"
import { getTierLimits } from "./tiers.js"

export type LimitCheckResult =
	| { allowed: true }
	| { allowed: false; limit: number; current: number; resource: string }

export async function checkProjectLimit(
	orgId: string,
	plan: TierName,
): Promise<LimitCheckResult> {
	const limits = getTierLimits(plan)
	if (limits.projects === Number.POSITIVE_INFINITY) return { allowed: true }

	const current = await organizationRepository.countProjectsByOrg(orgId)
	if (current >= limits.projects) {
		return {
			allowed: false,
			limit: limits.projects,
			current,
			resource: "projects",
		}
	}
	return { allowed: true }
}

export async function checkCronJobLimit(
	orgId: string,
	plan: TierName,
): Promise<LimitCheckResult> {
	const limits = getTierLimits(plan)
	if (limits.cronJobs === Number.POSITIVE_INFINITY) return { allowed: true }

	const current = await organizationRepository.countCronJobsByOrg(orgId)
	if (current >= limits.cronJobs) {
		return {
			allowed: false,
			limit: limits.cronJobs,
			current,
			resource: "cron jobs",
		}
	}
	return { allowed: true }
}

export async function checkHttpMonitorLimit(
	orgId: string,
	plan: TierName,
): Promise<LimitCheckResult> {
	const limits = getTierLimits(plan)
	if (limits.httpMonitors === Number.POSITIVE_INFINITY) return { allowed: true }

	const current = await organizationRepository.countHttpMonitorsByOrg(orgId)
	if (current >= limits.httpMonitors) {
		return {
			allowed: false,
			limit: limits.httpMonitors,
			current,
			resource: "HTTP monitors",
		}
	}
	return { allowed: true }
}

export async function checkChannelLimit(
	projectId: string,
	plan: TierName,
): Promise<LimitCheckResult> {
	const limits = getTierLimits(plan)
	if (limits.channelsPerProject === Number.POSITIVE_INFINITY)
		return { allowed: true }

	const current = await organizationRepository.countChannelsByProject(projectId)
	if (current >= limits.channelsPerProject) {
		return {
			allowed: false,
			limit: limits.channelsPerProject,
			current,
			resource: "channels",
		}
	}
	return { allowed: true }
}

export async function checkApiKeyLimit(
	projectId: string,
	plan: TierName,
): Promise<LimitCheckResult> {
	const limits = getTierLimits(plan)
	if (limits.apiKeysPerProject === Number.POSITIVE_INFINITY)
		return { allowed: true }

	const current = await organizationRepository.countApiKeysByProject(projectId)
	if (current >= limits.apiKeysPerProject) {
		return {
			allowed: false,
			limit: limits.apiKeysPerProject,
			current,
			resource: "API keys",
		}
	}
	return { allowed: true }
}

export function checkPingBodySize(
	bodySize: number,
	plan: TierName,
): LimitCheckResult {
	const limits = getTierLimits(plan)
	if (bodySize <= limits.pingBodyBytes) {
		return { allowed: true }
	}
	return {
		allowed: false,
		limit: limits.pingBodyBytes,
		current: bodySize,
		resource: "ping body size",
	}
}
