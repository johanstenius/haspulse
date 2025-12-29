import type { MonitorStatus } from "@haspulse/db"
import { dashboardRepository } from "../repositories/dashboard.repository.js"
import { statsRepository } from "../repositories/stats.repository.js"

export type DashboardStatsModel = {
	totalProjects: number
	totalCronJobs: number
	uptimePercent: number
	cronJobsByStatus: {
		UP: number
		DOWN: number
		LATE: number
		NEW: number
		PAUSED: number
	}
}

export type DashboardCronJobModel = {
	id: string
	name: string
	status: MonitorStatus
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

function sortCronJobsByPriority(
	cronJobs: DashboardCronJobModel[],
): DashboardCronJobModel[] {
	return [...cronJobs].sort((a, b) => {
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
	const [projectCount, cronJobCounts, uptimeData] = await Promise.all([
		dashboardRepository.countProjectsByOrgId(orgId),
		dashboardRepository.countCronJobsByStatusForOrg(orgId),
		statsRepository.getOrgUptimeForPeriod(orgId, 30),
	])

	const statusCounts: Record<MonitorStatus, number> = {
		UP: 0,
		DOWN: 0,
		LATE: 0,
		NEW: 0,
		PAUSED: 0,
	}

	let totalCronJobs = 0
	for (const item of cronJobCounts) {
		statusCounts[item.status] = item._count.id
		totalCronJobs += item._count.id
	}

	const totalMinutes = uptimeData.upMinutes + uptimeData.downMinutes
	const uptimePercent =
		totalMinutes > 0 ? (uptimeData.upMinutes / totalMinutes) * 100 : 100

	return {
		totalProjects: projectCount,
		totalCronJobs,
		uptimePercent: Math.round(uptimePercent * 10) / 10,
		cronJobsByStatus: statusCounts,
	}
}

export async function getDashboardCronJobs(
	orgId: string,
	limit = 10,
): Promise<DashboardCronJobModel[]> {
	const cronJobs = await dashboardRepository.findRecentCronJobsForOrg(
		orgId,
		limit,
	)
	return sortCronJobsByPriority(cronJobs)
}
