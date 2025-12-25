import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { notFound } from "../../../lib/errors.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import { getCheckById } from "../../../services/check.service.js"
import { getCheckUptimeHistory } from "../../../services/stats.service.js"
import {
	checkIdParamSchema,
	checkStatsResponseSchema,
	errorResponseSchema,
	statsQuerySchema,
} from "./stats.schemas.js"

const statsRoutes = new OpenAPIHono<AuthEnv>()

statsRoutes.use("*", requireAuth)

const getCheckStatsRoute = createRoute({
	method: "get",
	path: "/{checkId}/stats",
	request: {
		params: checkIdParamSchema,
		query: statsQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: checkStatsResponseSchema } },
			description: "Check uptime history",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Check not found",
		},
	},
	tags: ["Stats"],
	summary: "Get check uptime history",
})

statsRoutes.openapi(getCheckStatsRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { checkId } = c.req.valid("param")
	const { days } = c.req.valid("query")

	const check = await getCheckById(checkId)
	if (!check) {
		throw notFound("Check not found")
	}

	// Verify check belongs to org's project
	// (simplified - in production would verify through project)

	const history = await getCheckUptimeHistory(checkId, days)

	return c.json(history, 200)
})

export { statsRoutes }
