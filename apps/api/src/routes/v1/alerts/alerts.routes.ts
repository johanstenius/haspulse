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
import type {
	AlertModel,
	AlertModelWithCronJob,
} from "../../../repositories/alert.repository.js"
import {
	getCronJobAlertsPaginated,
	getOrgAlertsPaginated,
} from "../../../services/alert.service.js"
import { getCronJobById } from "../../../services/cron-job.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	type AlertResponse,
	type AlertWithCronJobResponse,
	alertFiltersQuerySchema,
	alertOrgFiltersQuerySchema,
	alertsListResponseSchema,
	cronJobAlertsListResponseSchema,
	cronJobIdParamSchema,
	errorResponseSchema,
} from "./alerts.schemas.js"

const cronJobAlertRoutes = new OpenAPIHono<AuthEnv>()
const alertRoutes = new OpenAPIHono<AuthEnv>()

cronJobAlertRoutes.use("*", requireAuth)
alertRoutes.use("*", requireAuth)

function toAlertResponse(alert: AlertModel): AlertResponse {
	return {
		id: alert.id,
		cronJobId: alert.cronJobId,
		event: alert.event as AlertResponse["event"],
		channels: alert.channels,
		context: alert.context,
		success: alert.success,
		error: alert.error,
		createdAt: alert.createdAt.toISOString(),
	}
}

function toAlertWithCronJobResponse(
	alert: AlertModelWithCronJob,
): AlertWithCronJobResponse {
	return {
		...toAlertResponse(alert),
		cronJobName: alert.cronJobName,
		projectId: alert.projectId,
		projectName: alert.projectName,
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

const listCronJobAlertsRoute = createRoute({
	method: "get",
	path: "/{cronJobId}/alerts",
	request: {
		params: cronJobIdParamSchema,
		query: alertFiltersQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": { schema: cronJobAlertsListResponseSchema },
			},
			description: "Paginated list of alerts for cron job",
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
	tags: ["Alerts"],
	summary: "List alerts for a cron job",
})

cronJobAlertRoutes.openapi(listCronJobAlertsRoute, async (c) => {
	const { cronJobId } = c.req.valid("param")
	const { page, limit, event, fromDate, toDate } = c.req.valid("query")

	await getAuthorizedCronJob(c, cronJobId)

	const result = await getCronJobAlertsPaginated(cronJobId, page, limit, {
		event,
		fromDate: fromDate ? new Date(fromDate) : undefined,
		toDate: toDate ? new Date(toDate) : undefined,
	})

	return c.json(
		{
			alerts: result.data.map(toAlertResponse),
			total: result.total,
			page: result.page,
			limit: result.limit,
			totalPages: result.totalPages,
		},
		200,
	)
})

const listOrgAlertsRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: alertOrgFiltersQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: alertsListResponseSchema } },
			description: "Paginated list of alerts across org",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden - API keys cannot access org alerts",
		},
	},
	tags: ["Alerts"],
	summary: "List all alerts across organization",
})

alertRoutes.openapi(listOrgAlertsRoute, async (c) => {
	if (isApiKeyAuth(c)) {
		throw forbidden("API keys cannot access organization-wide alerts")
	}

	const org = getRequiredOrg(c)
	const { page, limit, event, fromDate, toDate, projectId, cronJobId } =
		c.req.valid("query")

	const result = await getOrgAlertsPaginated(org.id, page, limit, {
		event,
		fromDate: fromDate ? new Date(fromDate) : undefined,
		toDate: toDate ? new Date(toDate) : undefined,
		projectId,
		cronJobId,
	})

	return c.json(
		{
			alerts: result.data.map(toAlertWithCronJobResponse),
			total: result.total,
			page: result.page,
			limit: result.limit,
			totalPages: result.totalPages,
		},
		200,
	)
})

export { alertRoutes, cronJobAlertRoutes }
