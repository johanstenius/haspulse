import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { notFound } from "../../../lib/errors.js"
import {
	toIncidentResponse,
	toIncidentUpdateResponse,
	toIncidentWithUpdatesResponse,
} from "../../../lib/mappers.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import {
	createIncident,
	createIncidentUpdate,
	deleteIncident,
	getIncidentById,
	getIncidentWithUpdates,
	listIncidentsByProjectPaginated,
	updateIncident,
} from "../../../services/incident.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	createIncidentBodySchema,
	createIncidentUpdateBodySchema,
	errorResponseSchema,
	incidentIdParamSchema,
	incidentListResponseSchema,
	incidentResponseSchema,
	incidentUpdateResponseSchema,
	incidentWithUpdatesResponseSchema,
	listIncidentsQuerySchema,
	projectIdParamSchema,
	updateIncidentBodySchema,
} from "./incidents.schemas.js"

const incidentRoutes = new OpenAPIHono<AuthEnv>()

incidentRoutes.use("*", requireAuth)

const listIncidentsRoute = createRoute({
	method: "get",
	path: "/{projectId}/incidents",
	request: {
		params: projectIdParamSchema,
		query: listIncidentsQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: incidentListResponseSchema } },
			description: "Paginated list of incidents",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
	},
	tags: ["Incidents"],
	summary: "List all incidents for a project",
})

const createIncidentRoute = createRoute({
	method: "post",
	path: "/{projectId}/incidents",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createIncidentBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: incidentResponseSchema } },
			description: "Incident created",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
	},
	tags: ["Incidents"],
	summary: "Create a new incident",
})

const getIncidentRoute = createRoute({
	method: "get",
	path: "/{projectId}/incidents/{incidentId}",
	request: { params: incidentIdParamSchema },
	responses: {
		200: {
			content: {
				"application/json": { schema: incidentWithUpdatesResponseSchema },
			},
			description: "Incident details with updates",
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
			description: "Incident not found",
		},
	},
	tags: ["Incidents"],
	summary: "Get incident by ID with updates",
})

const updateIncidentRoute = createRoute({
	method: "patch",
	path: "/{projectId}/incidents/{incidentId}",
	request: {
		params: incidentIdParamSchema,
		body: {
			content: { "application/json": { schema: updateIncidentBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: incidentResponseSchema } },
			description: "Incident updated",
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
			description: "Incident not found",
		},
	},
	tags: ["Incidents"],
	summary: "Update incident",
})

const deleteIncidentRoute = createRoute({
	method: "delete",
	path: "/{projectId}/incidents/{incidentId}",
	request: { params: incidentIdParamSchema },
	responses: {
		204: { description: "Incident deleted" },
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
			description: "Incident not found",
		},
	},
	tags: ["Incidents"],
	summary: "Delete incident",
})

const createIncidentUpdateRoute = createRoute({
	method: "post",
	path: "/{projectId}/incidents/{incidentId}/updates",
	request: {
		params: incidentIdParamSchema,
		body: {
			content: {
				"application/json": { schema: createIncidentUpdateBodySchema },
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": { schema: incidentUpdateResponseSchema },
			},
			description: "Incident update created",
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
			description: "Incident not found",
		},
	},
	tags: ["Incidents"],
	summary: "Add an update to an incident",
})

incidentRoutes.openapi(listIncidentsRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const { page, limit, status } = c.req.valid("query")
	await getProjectForOrg(projectId, org.id)

	const { data, total } = await listIncidentsByProjectPaginated(
		projectId,
		page,
		limit,
		status,
	)
	return c.json(
		{
			incidents: data.map(toIncidentResponse),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
		200,
	)
})

incidentRoutes.openapi(createIncidentRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const body = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const incident = await createIncident({
		projectId,
		title: body.title,
		status: body.status,
		impact: body.impact,
		checkIds: body.checkIds,
	})

	return c.json(toIncidentResponse(incident), 201)
})

incidentRoutes.openapi(getIncidentRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, incidentId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)

	const incident = await getIncidentWithUpdates(incidentId)
	if (!incident || incident.projectId !== projectId) {
		throw notFound("Incident not found")
	}

	return c.json(toIncidentWithUpdatesResponse(incident), 200)
})

incidentRoutes.openapi(updateIncidentRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, incidentId } = c.req.valid("param")
	const body = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const incident = await getIncidentById(incidentId)
	if (!incident || incident.projectId !== projectId) {
		throw notFound("Incident not found")
	}

	const updated = await updateIncident(incidentId, body)
	return c.json(toIncidentResponse(updated), 200)
})

incidentRoutes.openapi(deleteIncidentRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, incidentId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)

	const incident = await getIncidentById(incidentId)
	if (!incident || incident.projectId !== projectId) {
		throw notFound("Incident not found")
	}

	await deleteIncident(incidentId)
	return c.body(null, 204)
})

incidentRoutes.openapi(createIncidentUpdateRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, incidentId } = c.req.valid("param")
	const body = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const incident = await getIncidentById(incidentId)
	if (!incident || incident.projectId !== projectId) {
		throw notFound("Incident not found")
	}

	const update = await createIncidentUpdate({
		incidentId,
		status: body.status,
		message: body.message,
	})

	return c.json(toIncidentUpdateResponse(update), 201)
})

export { incidentRoutes }
