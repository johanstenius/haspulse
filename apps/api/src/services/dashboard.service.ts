import type { CheckStatus } from "@haspulse/db"
import { dashboardRepository } from "../repositories/dashboard.repository.js"

export type DashboardStatsModel = {
	totalProjects: number
	totalChecks: number
	checksByStatus: {
		UP: number
		DOWN: number
		LATE: number
		NEW: number
		PAUSED: number
	}
}

export type DashboardCheckModel = {
	id: string
	name: string
	status: CheckStatus
	scheduleType: "PERIOD" | "CRON"
	scheduleValue: string
	lastPingAt: Date | null
	createdAt: Date
	projectId: string
	projectName: string
}

const STATUS_ORDER: Record<string, number> = {
	DOWN: 0,
	LATE: 1,
	NEW: 2,
	UP: 3,
	PAUSED: 4,
}

function sortChecksByPriority(
	checks: DashboardCheckModel[],
): DashboardCheckModel[] {
	return [...checks].sort((a, b) => {
		const orderA = STATUS_ORDER[a.status] ?? 99
		const orderB = STATUS_ORDER[b.status] ?? 99
		if (orderA !== orderB) return orderA - orderB
		const timeA = a.lastPingAt?.getTime() ?? 0
		const timeB = b.lastPingAt?.getTime() ?? 0
		return timeB - timeA
	})
}

export async function getDashboardStats(
	orgId: string,
): Promise<DashboardStatsModel> {
	const [projectCount, checkCounts] = await Promise.all([
		dashboardRepository.countProjectsByOrgId(orgId),
		dashboardRepository.countChecksByStatusForOrg(orgId),
	])

	const statusCounts: Record<CheckStatus, number> = {
		UP: 0,
		DOWN: 0,
		LATE: 0,
		NEW: 0,
		PAUSED: 0,
	}

	let totalChecks = 0
	for (const item of checkCounts) {
		statusCounts[item.status] = item._count.id
		totalChecks += item._count.id
	}

	return {
		totalProjects: projectCount,
		totalChecks,
		checksByStatus: statusCounts,
	}
}

export async function getDashboardChecks(
	orgId: string,
	limit = 10,
): Promise<DashboardCheckModel[]> {
	const checks = await dashboardRepository.findRecentChecksForOrg(orgId, limit)
	return sortChecksByPriority(checks)
}
