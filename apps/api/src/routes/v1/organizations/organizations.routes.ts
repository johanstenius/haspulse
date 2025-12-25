import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { AppEnv } from "../../../app.js"
import { conflict } from "../../../lib/errors.js"
import { toOrgMemberResponse, toOrgResponse } from "../../../lib/mappers.js"
import { getRequiredUser, requireSession } from "../../../middleware/auth.js"
import {
	createOrganization,
	deleteOrganization,
	getOrgForUser,
	getOrgMembers,
	listOrganizationsByUser,
	requireOrgRole,
	slugExists,
	updateOrganization,
} from "../../../services/organization.service.js"
import {
	createOrgBodySchema,
	errorResponseSchema,
	orgIdParamSchema,
	orgListResponseSchema,
	orgMemberListResponseSchema,
	orgResponseSchema,
	updateOrgBodySchema,
} from "./organizations.schemas.js"

const organizationRoutes = new OpenAPIHono<AppEnv>()

organizationRoutes.use("*", requireSession)

const listOrgsRoute = createRoute({
	method: "get",
	path: "/",
	responses: {
		200: {
			content: { "application/json": { schema: orgListResponseSchema } },
			description: "List of organizations",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
	},
	tags: ["Organizations"],
	summary: "List all organizations for authenticated user",
})

const createOrgRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: { "application/json": { schema: createOrgBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: orgResponseSchema } },
			description: "Organization created",
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
	tags: ["Organizations"],
	summary: "Create a new organization",
})

const getOrgRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: { params: orgIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: orgResponseSchema } },
			description: "Organization details",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Organization not found",
		},
	},
	tags: ["Organizations"],
	summary: "Get organization by ID",
})

const updateOrgRoute = createRoute({
	method: "patch",
	path: "/{id}",
	request: {
		params: orgIdParamSchema,
		body: {
			content: { "application/json": { schema: updateOrgBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: orgResponseSchema } },
			description: "Organization updated",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden - requires owner or admin role",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Organization not found",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Slug already exists",
		},
	},
	tags: ["Organizations"],
	summary: "Update organization",
})

const deleteOrgRoute = createRoute({
	method: "delete",
	path: "/{id}",
	request: { params: orgIdParamSchema },
	responses: {
		204: { description: "Organization deleted" },
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden - requires owner role",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Organization not found",
		},
	},
	tags: ["Organizations"],
	summary: "Delete organization",
})

const listMembersRoute = createRoute({
	method: "get",
	path: "/{id}/members",
	request: { params: orgIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: orgMemberListResponseSchema } },
			description: "List of organization members",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Organization not found",
		},
	},
	tags: ["Organizations"],
	summary: "List organization members",
})

organizationRoutes.openapi(listOrgsRoute, async (c) => {
	const user = getRequiredUser(c)
	const organizations = await listOrganizationsByUser(user.id)
	return c.json({ organizations: organizations.map(toOrgResponse) }, 200)
})

organizationRoutes.openapi(createOrgRoute, async (c) => {
	const user = getRequiredUser(c)
	const body = c.req.valid("json")

	if (await slugExists(body.slug)) {
		throw conflict("Slug already exists")
	}

	const org = await createOrganization({
		name: body.name,
		slug: body.slug,
		ownerId: user.id,
	})

	return c.json(toOrgResponse(org), 201)
})

organizationRoutes.openapi(getOrgRoute, async (c) => {
	const user = getRequiredUser(c)
	const { id } = c.req.valid("param")
	const org = await getOrgForUser(id, user.id)
	return c.json(toOrgResponse(org), 200)
})

organizationRoutes.openapi(updateOrgRoute, async (c) => {
	const user = getRequiredUser(c)
	const { id } = c.req.valid("param")
	const body = c.req.valid("json")

	const org = await getOrgForUser(id, user.id)
	await requireOrgRole(id, user.id, ["owner", "admin"])

	if (body.slug && body.slug !== org.slug && (await slugExists(body.slug))) {
		throw conflict("Slug already exists")
	}

	const updated = await updateOrganization(id, body)
	return c.json(toOrgResponse(updated), 200)
})

organizationRoutes.openapi(deleteOrgRoute, async (c) => {
	const user = getRequiredUser(c)
	const { id } = c.req.valid("param")
	await getOrgForUser(id, user.id)
	await requireOrgRole(id, user.id, ["owner"])
	await deleteOrganization(id)
	return c.body(null, 204)
})

organizationRoutes.openapi(listMembersRoute, async (c) => {
	const user = getRequiredUser(c)
	const { id } = c.req.valid("param")
	await getOrgForUser(id, user.id)
	const members = await getOrgMembers(id)
	return c.json({ members: members.map(toOrgMemberResponse) }, 200)
})

export { organizationRoutes }
