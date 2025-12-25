import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { conflict, limitExceeded } from "../../../lib/errors.js"
import { checkProjectLimit } from "../../../lib/limits.js"
import { toProjectResponse } from "../../../lib/mappers.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import {
	createProject,
	deleteProject,
	getProjectForOrg,
	listProjectsByOrgPaginated,
	slugExists,
	updateProject,
} from "../../../services/project.service.js"
import {
	createProjectBodySchema,
	errorResponseSchema,
	paginationQuerySchema,
	projectIdParamSchema,
	projectListResponseSchema,
	projectResponseSchema,
	updateProjectBodySchema,
} from "./projects.schemas.js"

const projectRoutes = new OpenAPIHono<AuthEnv>()

projectRoutes.use("*", requireAuth)

const listProjectsRoute = createRoute({
	method: "get",
	path: "/",
	request: { query: paginationQuerySchema },
	responses: {
		200: {
			content: { "application/json": { schema: projectListResponseSchema } },
			description: "Paginated list of projects",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
	},
	tags: ["Projects"],
	summary: "List all projects for organization",
})

const createProjectRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: { "application/json": { schema: createProjectBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: projectResponseSchema } },
			description: "Project created",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Slug already exists",
		},
	},
	tags: ["Projects"],
	summary: "Create a new project",
})

const getProjectRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: projectResponseSchema } },
			description: "Project details",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Project not found",
		},
	},
	tags: ["Projects"],
	summary: "Get project by ID",
})

const updateProjectRoute = createRoute({
	method: "patch",
	path: "/{id}",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: updateProjectBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: projectResponseSchema } },
			description: "Project updated",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Project not found",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Slug already exists",
		},
	},
	tags: ["Projects"],
	summary: "Update project",
})

const deleteProjectRoute = createRoute({
	method: "delete",
	path: "/{id}",
	request: { params: projectIdParamSchema },
	responses: {
		204: { description: "Project deleted" },
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Project not found",
		},
	},
	tags: ["Projects"],
	summary: "Delete project",
})

projectRoutes.openapi(listProjectsRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { page, limit } = c.req.valid("query")
	const { data, total } = await listProjectsByOrgPaginated(org.id, page, limit)
	return c.json(
		{
			projects: data.map(toProjectResponse),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
		200,
	)
})

projectRoutes.openapi(createProjectRoute, async (c) => {
	const org = getRequiredOrg(c)
	const body = c.req.valid("json")

	const limitCheck = await checkProjectLimit(org.id, org.plan)
	if (!limitCheck.allowed) {
		throw limitExceeded(
			limitCheck.resource,
			limitCheck.limit,
			limitCheck.current,
		)
	}

	if (await slugExists(body.slug)) {
		throw conflict("Slug already exists")
	}

	const project = await createProject({
		orgId: org.id,
		name: body.name,
		slug: body.slug,
		timezone: body.timezone,
	})

	return c.json(toProjectResponse(project), 201)
})

projectRoutes.openapi(getProjectRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { id } = c.req.valid("param")
	const project = await getProjectForOrg(id, org.id)
	return c.json(toProjectResponse(project), 200)
})

projectRoutes.openapi(updateProjectRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { id } = c.req.valid("param")
	const body = c.req.valid("json")

	const project = await getProjectForOrg(id, org.id)

	if (
		body.slug &&
		body.slug !== project.slug &&
		(await slugExists(body.slug))
	) {
		throw conflict("Slug already exists")
	}

	const updated = await updateProject(id, body)
	return c.json(toProjectResponse(updated), 200)
})

projectRoutes.openapi(deleteProjectRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { id } = c.req.valid("param")
	await getProjectForOrg(id, org.id)
	await deleteProject(id)
	return c.body(null, 204)
})

export { projectRoutes }
