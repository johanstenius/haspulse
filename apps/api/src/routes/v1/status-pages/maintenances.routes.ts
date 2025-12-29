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
import { maintenanceRepository } from "../../../repositories/maintenance.repository.js"
import {
	type MaintenanceModel,
	maintenanceService,
} from "../../../services/maintenance.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import { statusPageService } from "../../../services/status-page.service.js"
import {
	type MaintenanceResponse,
	createMaintenanceSchema,
	maintenanceResponseSchema,
	maintenancesListResponseSchema,
	updateMaintenanceSchema,
} from "./maintenances.schemas.js"
import { errorResponseSchema } from "./status-pages.schemas.js"

const maintenanceRoutes = new OpenAPIHono<AuthEnv>()
maintenanceRoutes.use("*", requireAuth)

const projectIdParamSchema = z.object({
	projectId: z.string().openapi({ param: { name: "projectId", in: "path" } }),
})

const maintenanceIdParamSchema = z.object({
	projectId: z.string().openapi({ param: { name: "projectId", in: "path" } }),
	maintenanceId: z
		.string()
		.openapi({ param: { name: "maintenanceId", in: "path" } }),
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

function toMaintenanceResponse(
	maintenance: MaintenanceModel,
): MaintenanceResponse {
	return {
		id: maintenance.id,
		statusPageId: maintenance.statusPageId,
		title: maintenance.title,
		description: maintenance.description,
		componentIds: maintenance.componentIds,
		scheduledFor: maintenance.scheduledFor.toISOString(),
		expectedEnd: maintenance.expectedEnd.toISOString(),
		status: maintenance.status,
		createdAt: maintenance.createdAt.toISOString(),
		updatedAt: maintenance.updatedAt.toISOString(),
	}
}

async function getAuthorizedProject(c: Context<AuthEnv>, projectId: string) {
	if (isApiKeyAuth(c)) {
		throw forbidden("API key auth not supported for maintenances")
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

// GET /v1/projects/:projectId/status-page/maintenances
const listMaintenancesRoute = createRoute({
	method: "get",
	path: "/{projectId}/status-page/maintenances",
	request: {
		params: projectIdParamSchema,
		query: queryParamsSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": { schema: maintenancesListResponseSchema },
			},
			description: "List of maintenances",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Status page not found",
		},
	},
})

maintenanceRoutes.openapi(listMaintenancesRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	const { status, limit, offset } = c.req.valid("query")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const statusFilter = status
		? (status.split(",") as ("SCHEDULED" | "IN_PROGRESS" | "COMPLETED")[])
		: undefined

	const maintenances = await maintenanceService.listByStatusPageId(page.id, {
		status: statusFilter,
		limit,
		offset,
	})

	const total = await maintenanceRepository.countByStatusPageId(page.id)

	return c.json(
		{ maintenances: maintenances.map(toMaintenanceResponse), total },
		200,
	)
})

// GET /v1/projects/:projectId/status-page/maintenances/upcoming
const listUpcomingMaintenancesRoute = createRoute({
	method: "get",
	path: "/{projectId}/status-page/maintenances/upcoming",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						maintenances: z.array(maintenanceResponseSchema),
					}),
				},
			},
			description: "Upcoming and active maintenances",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Status page not found",
		},
	},
})

maintenanceRoutes.openapi(listUpcomingMaintenancesRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const maintenances = await maintenanceService.getUpcomingMaintenances(page.id)

	return c.json({ maintenances: maintenances.map(toMaintenanceResponse) }, 200)
})

// GET /v1/projects/:projectId/status-page/maintenances/:maintenanceId
const getMaintenanceRoute = createRoute({
	method: "get",
	path: "/{projectId}/status-page/maintenances/{maintenanceId}",
	request: { params: maintenanceIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: maintenanceResponseSchema } },
			description: "Maintenance details",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

maintenanceRoutes.openapi(getMaintenanceRoute, async (c) => {
	const { projectId, maintenanceId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const maintenance = await maintenanceService.getById(maintenanceId)
	if (!maintenance || maintenance.statusPageId !== page.id) {
		throw notFound("Maintenance not found")
	}

	return c.json(toMaintenanceResponse(maintenance), 200)
})

// POST /v1/projects/:projectId/status-page/maintenances
const createMaintenanceRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page/maintenances",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createMaintenanceSchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: maintenanceResponseSchema } },
			description: "Maintenance created",
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

maintenanceRoutes.openapi(createMaintenanceRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const body = c.req.valid("json")
	const maintenance = await maintenanceService.create({
		statusPageId: page.id,
		title: body.title,
		description: body.description,
		componentIds: body.componentIds,
		scheduledFor: new Date(body.scheduledFor),
		expectedEnd: new Date(body.expectedEnd),
	})

	return c.json(toMaintenanceResponse(maintenance), 201)
})

// PATCH /v1/projects/:projectId/status-page/maintenances/:maintenanceId
const updateMaintenanceRoute = createRoute({
	method: "patch",
	path: "/{projectId}/status-page/maintenances/{maintenanceId}",
	request: {
		params: maintenanceIdParamSchema,
		body: {
			content: { "application/json": { schema: updateMaintenanceSchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: maintenanceResponseSchema } },
			description: "Maintenance updated",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

maintenanceRoutes.openapi(updateMaintenanceRoute, async (c) => {
	const { projectId, maintenanceId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const existing = await maintenanceService.getById(maintenanceId)
	if (!existing || existing.statusPageId !== page.id) {
		throw notFound("Maintenance not found")
	}

	const body = c.req.valid("json")
	const maintenance = await maintenanceService.update(maintenanceId, {
		title: body.title,
		description: body.description,
		componentIds: body.componentIds,
		scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
		expectedEnd: body.expectedEnd ? new Date(body.expectedEnd) : undefined,
		status: body.status,
	})

	return c.json(toMaintenanceResponse(maintenance), 200)
})

// DELETE /v1/projects/:projectId/status-page/maintenances/:maintenanceId
const deleteMaintenanceRoute = createRoute({
	method: "delete",
	path: "/{projectId}/status-page/maintenances/{maintenanceId}",
	request: { params: maintenanceIdParamSchema },
	responses: {
		204: { description: "Maintenance deleted" },
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

maintenanceRoutes.openapi(deleteMaintenanceRoute, async (c) => {
	const { projectId, maintenanceId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)
	const page = await getStatusPageOrThrow(projectId)

	const existing = await maintenanceService.getById(maintenanceId)
	if (!existing || existing.statusPageId !== page.id) {
		throw notFound("Maintenance not found")
	}

	await maintenanceService.delete(maintenanceId)
	return c.body(null, 204)
})

export { maintenanceRoutes }
