import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import type { Context } from "hono"
import { forbidden, notFound } from "../../../lib/errors.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import {
	getRequiredOrg,
	isApiKeyAuth,
	requireAuth,
} from "../../../middleware/auth.js"
import { incidentRepository } from "../../../repositories/incident.repository.js"
import {
	type IncidentModel,
	type IncidentUpdateModel,
	type IncidentWithUpdates,
	incidentService,
} from "../../../services/incident.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import { statusPageService } from "../../../services/status-page.service.js"
import {
	type IncidentResponse,
	type IncidentUpdateResponse,
	type IncidentWithUpdatesResponse,
	createIncidentSchema,
	createIncidentUpdateSchema,
	incidentResponseSchema,
	incidentUpdateResponseSchema,
	incidentWithUpdatesResponseSchema,
	incidentsListResponseSchema,
	incidentsListWithUpdatesResponseSchema,
	updateIncidentSchema,
} from "./incidents.schemas.js"
import { errorResponseSchema } from "./status-pages.schemas.js"

const incidentRoutes = new OpenAPIHono<AuthEnv>()
incidentRoutes.use("*", requireAuth)

const projectIdParamSchema = z.object({
	projectId: z.string().openapi({ param: { name: "projectId", in: "path" } }),
})

const incidentIdParamSchema = z.object({
	projectId: z.string().openapi({ param: { name: "projectId", in: "path" } }),
	incidentId: z.string().openapi({ param: { name: "incidentId", in: "path" } }),
})

const queryParamsSchema = z.object({
	status: z
		.string()
		.optional()
		.openapi({ param: { name: "status", in: "query" } }),
	limit: z.coerce
		.number()
		.min(1)
		.max(100)
		.default(50)
		.openapi({ param: { name: "limit", in: "query" } }),
	offset: z.coerce
		.number()
		.min(0)
		.default(0)
		.openapi({ param: { name: "offset", in: "query" } }),
})

function toIncidentResponse(incident: IncidentModel): IncidentResponse {
	return {
		id: incident.id,
		statusPageId: incident.statusPageId,
		title: incident.title,
		status: incident.status,
		severity: incident.severity,
		componentIds: incident.componentIds,
		autoCreated: incident.autoCreated,
		sourceCronJobId: incident.sourceCronJobId,
		sourceHttpMonitorId: incident.sourceHttpMonitorId,
		startsAt: incident.startsAt.toISOString(),
		resolvedAt: incident.resolvedAt?.toISOString() ?? null,
		createdAt: incident.createdAt.toISOString(),
		updatedAt: incident.updatedAt.toISOString(),
	}
}

function toIncidentUpdateResponse(
	update: IncidentUpdateModel,
): IncidentUpdateResponse {
	return {
		id: update.id,
		incidentId: update.incidentId,
		status: update.status,
		message: update.message,
		createdAt: update.createdAt.toISOString(),
	}
}

function toIncidentWithUpdatesResponse(
	incident: IncidentWithUpdates,
): IncidentWithUpdatesResponse {
	return {
		...toIncidentResponse(incident),
		updates: incident.updates.map(toIncidentUpdateResponse),
	}
}

async function getAuthorizedProject(c: Context<AuthEnv>, projectId: string) {
	if (isApiKeyAuth(c)) {
		throw forbidden("API key auth not supported for incidents")
	}
	const org = getRequiredOrg(c)
	return getProjectForOrg(projectId, org.id)
}

async function getStatusPageOrThrow(projectId: string) {
	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}
	return page
}

// GET /v1/projects/:projectId/status-page/incidents
const listIncidentsRoute = createRoute({
	method: "get",
	path: "/{projectId}/status-page/incidents",
	request: {
		params: projectIdParamSchema,
		query: queryParamsSchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: incidentsListResponseSchema } },
			description: "List of incidents",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Status page not found",
		},
	},
})

incidentRoutes.openapi(listIncidentsRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	const { status, limit, offset } = c.req.valid("query")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const statusFilter = status
		? (status.split(",") as (
				| "INVESTIGATING"
				| "IDENTIFIED"
				| "MONITORING"
				| "RESOLVED"
			)[])
		: undefined

	const incidents = await incidentService.listByStatusPageId(page.id, {
		status: statusFilter,
		limit,
		offset,
	})

	const total = await incidentRepository.countByStatusPageId(page.id)

	return c.json({ incidents: incidents.map(toIncidentResponse), total }, 200)
})

// GET /v1/projects/:projectId/status-page/incidents/active
const listActiveIncidentsRoute = createRoute({
	method: "get",
	path: "/{projectId}/status-page/incidents/active",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: {
				"application/json": { schema: incidentsListWithUpdatesResponseSchema },
			},
			description: "Active incidents with updates",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Status page not found",
		},
	},
})

incidentRoutes.openapi(listActiveIncidentsRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const incidents = await incidentService.getActiveIncidents(page.id)

	return c.json(
		{ incidents: incidents.map(toIncidentWithUpdatesResponse) },
		200,
	)
})

// GET /v1/projects/:projectId/status-page/incidents/:incidentId
const getIncidentRoute = createRoute({
	method: "get",
	path: "/{projectId}/status-page/incidents/{incidentId}",
	request: { params: incidentIdParamSchema },
	responses: {
		200: {
			content: {
				"application/json": { schema: incidentWithUpdatesResponseSchema },
			},
			description: "Incident details with updates",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

incidentRoutes.openapi(getIncidentRoute, async (c) => {
	const { projectId, incidentId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const incident = await incidentService.getByIdWithUpdates(incidentId)
	if (!incident || incident.statusPageId !== page.id) {
		throw notFound("Incident not found")
	}

	return c.json(toIncidentWithUpdatesResponse(incident), 200)
})

// POST /v1/projects/:projectId/status-page/incidents
const createIncidentRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page/incidents",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createIncidentSchema } },
		},
	},
	responses: {
		201: {
			content: {
				"application/json": { schema: incidentWithUpdatesResponseSchema },
			},
			description: "Incident created",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Bad request",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Status page not found",
		},
	},
})

incidentRoutes.openapi(createIncidentRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const body = c.req.valid("json")
	const incident = await incidentService.create({
		statusPageId: page.id,
		title: body.title,
		severity: body.severity,
		componentIds: body.componentIds,
		initialMessage: body.initialMessage,
	})

	return c.json(toIncidentWithUpdatesResponse(incident), 201)
})

// PATCH /v1/projects/:projectId/status-page/incidents/:incidentId
const updateIncidentRoute = createRoute({
	method: "patch",
	path: "/{projectId}/status-page/incidents/{incidentId}",
	request: {
		params: incidentIdParamSchema,
		body: {
			content: { "application/json": { schema: updateIncidentSchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: incidentResponseSchema } },
			description: "Incident updated",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

incidentRoutes.openapi(updateIncidentRoute, async (c) => {
	const { projectId, incidentId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const existing = await incidentService.getById(incidentId)
	if (!existing || existing.statusPageId !== page.id) {
		throw notFound("Incident not found")
	}

	const body = c.req.valid("json")
	const incident = await incidentService.update(incidentId, body)

	return c.json(toIncidentResponse(incident), 200)
})

// DELETE /v1/projects/:projectId/status-page/incidents/:incidentId
const deleteIncidentRoute = createRoute({
	method: "delete",
	path: "/{projectId}/status-page/incidents/{incidentId}",
	request: { params: incidentIdParamSchema },
	responses: {
		204: { description: "Incident deleted" },
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

incidentRoutes.openapi(deleteIncidentRoute, async (c) => {
	const { projectId, incidentId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const existing = await incidentService.getById(incidentId)
	if (!existing || existing.statusPageId !== page.id) {
		throw notFound("Incident not found")
	}

	await incidentService.delete(incidentId)
	return c.body(null, 204)
})

// POST /v1/projects/:projectId/status-page/incidents/:incidentId/updates
const createIncidentUpdateRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page/incidents/{incidentId}/updates",
	request: {
		params: incidentIdParamSchema,
		body: {
			content: { "application/json": { schema: createIncidentUpdateSchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: incidentUpdateResponseSchema } },
			description: "Update added",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

incidentRoutes.openapi(createIncidentUpdateRoute, async (c) => {
	const { projectId, incidentId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const existing = await incidentService.getById(incidentId)
	if (!existing || existing.statusPageId !== page.id) {
		throw notFound("Incident not found")
	}

	const body = c.req.valid("json")
	const update = await incidentService.addUpdate({
		incidentId,
		status: body.status,
		message: body.message,
	})

	return c.json(toIncidentUpdateResponse(update), 201)
})

export { incidentRoutes }
