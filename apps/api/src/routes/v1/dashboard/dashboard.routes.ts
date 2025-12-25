import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import {
	getDashboardChecks,
	getDashboardStats,
} from "../../../services/dashboard.service.js"
import {
	dashboardChecksResponseSchema,
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

const getChecksRoute = createRoute({
	method: "get",
	path: "/checks",
	responses: {
		200: {
			content: {
				"application/json": { schema: dashboardChecksResponseSchema },
			},
			description: "Recent checks for dashboard",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
	},
	tags: ["Dashboard"],
	summary: "Get recent checks for dashboard",
})

dashboardRoutes.openapi(getChecksRoute, async (c) => {
	const org = getRequiredOrg(c)
	const checks = await getDashboardChecks(org.id)

	return c.json(
		{
			checks: checks.map((check) => ({
				id: check.id,
				name: check.name,
				status: check.status,
				scheduleType: check.scheduleType,
				scheduleValue: check.scheduleValue,
				lastPingAt: check.lastPingAt?.toISOString() ?? null,
				projectId: check.projectId,
				projectName: check.projectName,
			})),
		},
		200,
	)
})

export { dashboardRoutes }
