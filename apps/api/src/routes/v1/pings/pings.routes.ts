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
import { getCronJobById } from "../../../services/cron-job.service.js"
import {
	type PingModel,
	listPingsByCronJobPaginated,
} from "../../../services/ping.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	type PingEntryResponse,
	cronJobIdParamSchema,
	errorResponseSchema,
	pingListResponseSchema,
	pingQuerySchema,
} from "./pings.schemas.js"

const pingHistoryRoutes = new OpenAPIHono<AuthEnv>()

pingHistoryRoutes.use("*", requireAuth)

function toPingResponse(ping: PingModel): PingEntryResponse {
	return {
		id: ping.id,
		cronJobId: ping.cronJobId,
		type: ping.type,
		body: ping.body,
		sourceIp: ping.sourceIp,
		createdAt: ping.createdAt.toISOString(),
	}
}

async function getAuthorizedCronJob(c: Context<AuthEnv>, cronJobId: string) {
	const cronJob = await getCronJobById(cronJobId)
	if (!cronJob) throw notFound("Cron job not found")

	if (isApiKeyAuth(c)) {
		const apiKeyProjectId = getApiKeyProjectId(c)
		if (cronJob.projectId !== apiKeyProjectId)
			throw forbidden("API key not valid for this cron job")
	} else {
		const org = getRequiredOrg(c)
		await getProjectForOrg(cronJob.projectId, org.id)
	}

	return cronJob
}

const listPingsRoute = createRoute({
	method: "get",
	path: "/{id}/pings",
	request: {
		params: cronJobIdParamSchema,
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
			description: "Cron job not found",
		},
	},
	tags: ["Pings"],
	summary: "List ping history for a cron job",
})

pingHistoryRoutes.openapi(listPingsRoute, async (c) => {
	const { id } = c.req.valid("param")
	const { page, limit } = c.req.valid("query")
	const cronJob = await getAuthorizedCronJob(c, id)
	const result = await listPingsByCronJobPaginated(cronJob.id, page, limit)
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
