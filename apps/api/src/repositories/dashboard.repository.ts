import { type MonitorStatus, prisma } from "@haspulse/db"

export type DashboardCronJobRow = {
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

export type StatusCountRow = {
	status: MonitorStatus
	_count: { id: number }
}

export const dashboardRepository = {
	async countProjectsByOrgId(orgId: string): Promise<number> {
		return prisma.project.count({ where: { orgId } })
	},

	async countCronJobsByStatusForOrg(orgId: string): Promise<StatusCountRow[]> {
		const result = await prisma.cronJob.groupBy({
			by: ["status"],
			where: { project: { orgId } },
			_count: { id: true },
		})
		return result
	},

	async findRecentCronJobsForOrg(
		orgId: string,
		limit: number,
	): Promise<DashboardCronJobRow[]> {
		const cronJobs = await prisma.cronJob.findMany({
			where: { project: { orgId } },
			include: { project: { select: { id: true, name: true } } },
			orderBy: { lastPingAt: "desc" },
			take: limit,
		})

		return cronJobs.map((cronJob) => ({
			id: cronJob.id,
			name: cronJob.name,
			status: cronJob.status,
			scheduleType: cronJob.scheduleType,
			scheduleValue: cronJob.scheduleValue,
			lastPingAt: cronJob.lastPingAt,
			createdAt: cronJob.createdAt,
			projectId: cronJob.project.id,
			projectName: cronJob.project.name,
		}))
	},
}
