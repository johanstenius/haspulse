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
	AlertModelWithCheck,
} from "../../../repositories/alert.repository.js"
import {
	getCheckAlertsPaginated,
	getOrgAlertsPaginated,
} from "../../../services/alert.service.js"
import { getCheckById } from "../../../services/check.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	type AlertResponse,
	type AlertWithCheckResponse,
	alertFiltersQuerySchema,
	alertOrgFiltersQuerySchema,
	alertsListResponseSchema,
	checkAlertsListResponseSchema,
	checkIdParamSchema,
	errorResponseSchema,
} from "./alerts.schemas.js"

const checkAlertRoutes = new OpenAPIHono<AuthEnv>()
const alertRoutes = new OpenAPIHono<AuthEnv>()

checkAlertRoutes.use("*", requireAuth)
alertRoutes.use("*", requireAuth)

function toAlertResponse(alert: AlertModel): AlertResponse {
	return {
		id: alert.id,
		checkId: alert.checkId,
		event: alert.event as AlertResponse["event"],
		channels: alert.channels,
		context: alert.context,
		success: alert.success,
		error: alert.error,
		createdAt: alert.createdAt.toISOString(),
	}
}

function toAlertWithCheckResponse(
	alert: AlertModelWithCheck,
): AlertWithCheckResponse {
	return {
		...toAlertResponse(alert),
		checkName: alert.checkName,
		projectId: alert.projectId,
		projectName: alert.projectName,
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

const listCheckAlertsRoute = createRoute({
	method: "get",
	path: "/{checkId}/alerts",
	request: {
		params: checkIdParamSchema,
		query: alertFiltersQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": { schema: checkAlertsListResponseSchema },
			},
			description: "Paginated list of alerts for check",
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
	tags: ["Alerts"],
	summary: "List alerts for a check",
})

checkAlertRoutes.openapi(listCheckAlertsRoute, async (c) => {
	const { checkId } = c.req.valid("param")
	const { page, limit, event, fromDate, toDate } = c.req.valid("query")

	await getAuthorizedCheck(c, checkId)

	const result = await getCheckAlertsPaginated(checkId, page, limit, {
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
	const { page, limit, event, fromDate, toDate, projectId, checkId } =
		c.req.valid("query")

	const result = await getOrgAlertsPaginated(org.id, page, limit, {
		event,
		fromDate: fromDate ? new Date(fromDate) : undefined,
		toDate: toDate ? new Date(toDate) : undefined,
		projectId,
		checkId,
	})

	return c.json(
		{
			alerts: result.data.map(toAlertWithCheckResponse),
			total: result.total,
			page: result.page,
			limit: result.limit,
			totalPages: result.totalPages,
		},
		200,
	)
})

export { alertRoutes, checkAlertRoutes }
