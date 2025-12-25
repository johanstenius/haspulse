import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { notFound } from "../../../lib/errors.js"
import {
	toMaintenanceResponse,
	toMaintenanceWithChecksResponse,
} from "../../../lib/mappers.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import {
	createMaintenance,
	deleteMaintenance,
	getMaintenanceById,
	getMaintenanceWithChecks,
	listMaintenanceByProjectPaginated,
	setMaintenanceChecks,
	updateMaintenance,
} from "../../../services/maintenance.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	createMaintenanceBodySchema,
	errorResponseSchema,
	listMaintenanceQuerySchema,
	maintenanceIdParamSchema,
	maintenanceListResponseSchema,
	maintenanceResponseSchema,
	maintenanceWithChecksResponseSchema,
	projectIdParamSchema,
	updateMaintenanceBodySchema,
} from "./maintenance.schemas.js"

const maintenanceRoutes = new OpenAPIHono<AuthEnv>()

maintenanceRoutes.use("*", requireAuth)

const listMaintenanceRoute = createRoute({
	method: "get",
	path: "/{projectId}/maintenance",
	request: {
		params: projectIdParamSchema,
		query: listMaintenanceQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": { schema: maintenanceListResponseSchema },
			},
			description: "Paginated list of maintenance windows",
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
	tags: ["Maintenance"],
	summary: "List all maintenance windows for a project",
})

const createMaintenanceRoute = createRoute({
	method: "post",
	path: "/{projectId}/maintenance",
	request: {
		params: projectIdParamSchema,
		body: {
			content: {
				"application/json": { schema: createMaintenanceBodySchema },
			},
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: maintenanceResponseSchema } },
			description: "Maintenance window created",
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
	tags: ["Maintenance"],
	summary: "Schedule a new maintenance window",
})

const getMaintenanceRoute = createRoute({
	method: "get",
	path: "/{projectId}/maintenance/{maintenanceId}",
	request: { params: maintenanceIdParamSchema },
	responses: {
		200: {
			content: {
				"application/json": { schema: maintenanceWithChecksResponseSchema },
			},
			description: "Maintenance window details",
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
			description: "Maintenance not found",
		},
	},
	tags: ["Maintenance"],
	summary: "Get maintenance window by ID",
})

const updateMaintenanceRoute = createRoute({
	method: "patch",
	path: "/{projectId}/maintenance/{maintenanceId}",
	request: {
		params: maintenanceIdParamSchema,
		body: {
			content: {
				"application/json": { schema: updateMaintenanceBodySchema },
			},
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: maintenanceResponseSchema } },
			description: "Maintenance window updated",
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
			description: "Maintenance not found",
		},
	},
	tags: ["Maintenance"],
	summary: "Update maintenance window",
})

const deleteMaintenanceRoute = createRoute({
	method: "delete",
	path: "/{projectId}/maintenance/{maintenanceId}",
	request: { params: maintenanceIdParamSchema },
	responses: {
		204: { description: "Maintenance window deleted" },
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
			description: "Maintenance not found",
		},
	},
	tags: ["Maintenance"],
	summary: "Delete/cancel maintenance window",
})

maintenanceRoutes.openapi(listMaintenanceRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const { page, limit, upcoming } = c.req.valid("query")
	await getProjectForOrg(projectId, org.id)

	const { data, total } = await listMaintenanceByProjectPaginated(
		projectId,
		page,
		limit,
		upcoming,
	)
	return c.json(
		{
			maintenance: data.map(toMaintenanceResponse),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
		200,
	)
})

maintenanceRoutes.openapi(createMaintenanceRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const body = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const maintenance = await createMaintenance({
		projectId,
		title: body.title,
		description: body.description,
		startsAt: new Date(body.startsAt),
		endsAt: new Date(body.endsAt),
		checkIds: body.checkIds,
	})

	return c.json(toMaintenanceResponse(maintenance), 201)
})

maintenanceRoutes.openapi(getMaintenanceRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, maintenanceId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)

	const maintenance = await getMaintenanceWithChecks(maintenanceId)
	if (!maintenance || maintenance.projectId !== projectId) {
		throw notFound("Maintenance not found")
	}

	return c.json(toMaintenanceWithChecksResponse(maintenance), 200)
})

maintenanceRoutes.openapi(updateMaintenanceRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, maintenanceId } = c.req.valid("param")
	const body = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const existing = await getMaintenanceById(maintenanceId)
	if (!existing || existing.projectId !== projectId) {
		throw notFound("Maintenance not found")
	}

	const updated = await updateMaintenance(maintenanceId, {
		title: body.title,
		description: body.description,
		startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
		endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
	})

	if (body.checkIds !== undefined) {
		await setMaintenanceChecks(maintenanceId, body.checkIds)
	}

	return c.json(toMaintenanceResponse(updated), 200)
})

maintenanceRoutes.openapi(deleteMaintenanceRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, maintenanceId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)

	const existing = await getMaintenanceById(maintenanceId)
	if (!existing || existing.projectId !== projectId) {
		throw notFound("Maintenance not found")
	}

	await deleteMaintenance(maintenanceId)
	return c.body(null, 204)
})

export { maintenanceRoutes }
