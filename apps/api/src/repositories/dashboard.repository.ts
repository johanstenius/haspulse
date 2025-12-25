import { type CheckStatus, prisma } from "@haspulse/db"

export type DashboardCheckRow = {
	id: string
	name: string
	status: CheckStatus
	scheduleType: "PERIOD" | "CRON"
	scheduleValue: string
	lastPingAt: Date | null
	projectId: string
	projectName: string
}

export type StatusCountRow = {
	status: CheckStatus
	_count: { id: number }
}

export const dashboardRepository = {
	async countProjectsByOrgId(orgId: string): Promise<number> {
		return prisma.project.count({ where: { orgId } })
	},

	async countChecksByStatusForOrg(orgId: string): Promise<StatusCountRow[]> {
		const result = await prisma.check.groupBy({
			by: ["status"],
			where: { project: { orgId } },
			_count: { id: true },
		})
		return result
	},

	async findRecentChecksForOrg(
		orgId: string,
		limit: number,
	): Promise<DashboardCheckRow[]> {
		const checks = await prisma.check.findMany({
			where: { project: { orgId } },
			include: { project: { select: { id: true, name: true } } },
			orderBy: { lastPingAt: "desc" },
			take: limit,
		})

		return checks.map((check) => ({
			id: check.id,
			name: check.name,
			status: check.status,
			scheduleType: check.scheduleType,
			scheduleValue: check.scheduleValue,
			lastPingAt: check.lastPingAt,
			projectId: check.project.id,
			projectName: check.project.name,
		}))
	},
}
