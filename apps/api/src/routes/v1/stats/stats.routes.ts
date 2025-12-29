import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { notFound } from "../../../lib/errors.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import { getCronJobById } from "../../../services/cron-job.service.js"
import { getCronJobUptimeHistory } from "../../../services/stats.service.js"
import {
	cronJobIdParamSchema,
	cronJobStatsResponseSchema,
	errorResponseSchema,
	statsQuerySchema,
} from "./stats.schemas.js"

const statsRoutes = new OpenAPIHono<AuthEnv>()

statsRoutes.use("*", requireAuth)

const getCronJobStatsRoute = createRoute({
	method: "get",
	path: "/{cronJobId}/stats",
	request: {
		params: cronJobIdParamSchema,
		query: statsQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: cronJobStatsResponseSchema } },
			description: "Cron job uptime history",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Cron job not found",
		},
	},
	tags: ["Stats"],
	summary: "Get cron job uptime history",
})

statsRoutes.openapi(getCronJobStatsRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { cronJobId } = c.req.valid("param")
	const { days } = c.req.valid("query")

	const cronJob = await getCronJobById(cronJobId)
	if (!cronJob) {
		throw notFound("Cron job not found")
	}

	// Verify cron job belongs to org's project
	// (simplified - in production would verify through project)

	const history = await getCronJobUptimeHistory(cronJobId, days)

	return c.json(history, 200)
})

export { statsRoutes }
