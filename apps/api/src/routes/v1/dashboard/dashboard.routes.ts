import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import { pingRepository } from "../../../repositories/ping.repository.js"
import {
	getDashboardCronJobs,
	getDashboardStats,
} from "../../../services/dashboard.service.js"
import { calculateSparkline } from "../../../services/sparkline.service.js"
import {
	dashboardCronJobsResponseSchema,
	dashboardStatsResponseSchema,
	errorResponseSchema,
} from "./dashboard.schemas.js"

const dashboardRoutes = new OpenAPIHono<AuthEnv>()

dashboardRoutes.use("*", requireAuth)

const getStatsRoute = createRoute({
	method: "get",
	path: "/stats",
	responses: {
		200: {
			content: { "application/json": { schema: dashboardStatsResponseSchema } },
			description: "Dashboard statistics",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
	},
	tags: ["Dashboard"],
	summary: "Get dashboard statistics",
})

dashboardRoutes.openapi(getStatsRoute, async (c) => {
	const org = getRequiredOrg(c)
	const stats = await getDashboardStats(org.id)
	return c.json(stats, 200)
})

const getCronJobsRoute = createRoute({
	method: "get",
	path: "/cron-jobs",
	responses: {
		200: {
			content: {
				"application/json": { schema: dashboardCronJobsResponseSchema },
			},
			description: "Recent cron jobs for dashboard",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
	},
	tags: ["Dashboard"],
	summary: "Get recent cron jobs for dashboard",
})

dashboardRoutes.openapi(getCronJobsRoute, async (c) => {
	const org = getRequiredOrg(c)
	const cronJobs = await getDashboardCronJobs(org.id)

	const cronJobIds = cronJobs.map((cronJob) => cronJob.id)
	const pingsMap = await pingRepository.findRecentByCronJobIds(cronJobIds, 20)

	return c.json(
		{
			cronJobs: cronJobs.map((cronJob) => {
				const pings = pingsMap.get(cronJob.id) ?? []
				const sparkline = calculateSparkline(cronJob, pings)
				return {
					id: cronJob.id,
					name: cronJob.name,
					status: cronJob.status,
					scheduleType: cronJob.scheduleType,
					scheduleValue: cronJob.scheduleValue,
					lastPingAt: cronJob.lastPingAt?.toISOString() ?? null,
					projectId: cronJob.projectId,
					projectName: cronJob.projectName,
					sparkline,
				}
			}),
		},
		200,
	)
})

export { dashboardRoutes }
