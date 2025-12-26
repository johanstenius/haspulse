import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { Context } from "hono"
import { forbidden, notFound } from "../../../lib/errors.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import {
	getApiKeyProjectId,
	getRequiredOrg,
	isApiKeyAuth,
	requireAuth,
} from "../../../middleware/auth.js"
import { getCheckById } from "../../../services/check.service.js"
import {
	type PingModel,
	listPingsByCheckPaginated,
} from "../../../services/ping.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	type PingEntryResponse,
	checkIdParamSchema,
	errorResponseSchema,
	pingListResponseSchema,
	pingQuerySchema,
} from "./pings.schemas.js"

const pingHistoryRoutes = new OpenAPIHono<AuthEnv>()

pingHistoryRoutes.use("*", requireAuth)

function toPingResponse(ping: PingModel): PingEntryResponse {
	return {
		id: ping.id,
		checkId: ping.checkId,
		type: ping.type,
		body: ping.body,
		sourceIp: ping.sourceIp,
		createdAt: ping.createdAt.toISOString(),
	}
}

async function getAuthorizedCheck(c: Context<AuthEnv>, checkId: string) {
	const check = await getCheckById(checkId)
	if (!check) throw notFound("Check not found")

	if (isApiKeyAuth(c)) {
		const apiKeyProjectId = getApiKeyProjectId(c)
		if (check.projectId !== apiKeyProjectId)
			throw forbidden("API key not valid for this check")
	} else {
		const org = getRequiredOrg(c)
		await getProjectForOrg(check.projectId, org.id)
	}

	return check
}

const listPingsRoute = createRoute({
	method: "get",
	path: "/{id}/pings",
	request: {
		params: checkIdParamSchema,
		query: pingQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: pingListResponseSchema } },
			description: "List of pings",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Check not found",
		},
	},
	tags: ["Pings"],
	summary: "List ping history for a check",
})

pingHistoryRoutes.openapi(listPingsRoute, async (c) => {
	const { id } = c.req.valid("param")
	const { page, limit } = c.req.valid("query")
	const check = await getAuthorizedCheck(c, id)
	const result = await listPingsByCheckPaginated(check.id, page, limit)
	return c.json(
		{
			pings: result.data.map(toPingResponse),
			total: result.total,
			page: result.page,
			limit: result.limit,
			totalPages: result.totalPages,
		},
		200,
	)
})

export { pingHistoryRoutes }
