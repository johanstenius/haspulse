import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { AppEnv } from "../../../app.js"
import { toInvitationResponse } from "../../../lib/mappers.js"
import { getRequiredUser, requireSession } from "../../../middleware/auth.js"
import {
	acceptInvitation,
	cancelInvitation,
	createInvitation,
	listPendingInvitations,
	resendInvitation,
} from "../../../services/invitation.service.js"
import {
	getOrgForUser,
	requireOrgRole,
} from "../../../services/organization.service.js"
import {
	acceptInvitationBodySchema,
	acceptInvitationResponseSchema,
	createInvitationBodySchema,
	errorResponseSchema,
	invitationListResponseSchema,
	invitationResponseSchema,
	orgAndInviteIdParamSchema,
	orgIdParamSchema,
} from "./invitations.schemas.js"

const invitationRoutes = new OpenAPIHono<AppEnv>()

invitationRoutes.use("*", requireSession)

// POST /organizations/{orgId}/invites - Create invitation
const createInviteRoute = createRoute({
	method: "post",
	path: "/organizations/{orgId}/invites",
	request: {
		params: orgIdParamSchema,
		body: {
			content: { "application/json": { schema: createInvitationBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: invitationResponseSchema } },
			description: "Invitation created",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Bad request - invitation already exists",
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
	},
	tags: ["Invitations"],
	summary: "Send invitation to join organization",
})

// GET /organizations/{orgId}/invites - List pending invitations
const listInvitesRoute = createRoute({
	method: "get",
	path: "/organizations/{orgId}/invites",
	request: { params: orgIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: invitationListResponseSchema } },
			description: "List of pending invitations",
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
	},
	tags: ["Invitations"],
	summary: "List pending invitations",
})

// DELETE /organizations/{orgId}/invites/{inviteId} - Cancel invitation
const cancelInviteRoute = createRoute({
	method: "delete",
	path: "/organizations/{orgId}/invites/{inviteId}",
	request: { params: orgAndInviteIdParamSchema },
	responses: {
		204: { description: "Invitation cancelled" },
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
			description: "Invitation not found",
		},
	},
	tags: ["Invitations"],
	summary: "Cancel invitation",
})

// POST /organizations/{orgId}/invites/{inviteId}/resend - Resend invitation
const resendInviteRoute = createRoute({
	method: "post",
	path: "/organizations/{orgId}/invites/{inviteId}/resend",
	request: { params: orgAndInviteIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: invitationResponseSchema } },
			description: "Invitation resent",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Bad request - invitation already accepted",
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
			description: "Invitation not found",
		},
	},
	tags: ["Invitations"],
	summary: "Resend invitation email",
})

// POST /invites/accept - Accept invitation (separate path since user may not be member yet)
const acceptInviteRoute = createRoute({
	method: "post",
	path: "/invites/accept",
	request: {
		body: {
			content: { "application/json": { schema: acceptInvitationBodySchema } },
		},
	},
	responses: {
		200: {
			content: {
				"application/json": { schema: acceptInvitationResponseSchema },
			},
			description: "Invitation accepted",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Bad request - invitation expired or already accepted",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Invitation not found",
		},
	},
	tags: ["Invitations"],
	summary: "Accept invitation to join organization",
})

invitationRoutes.openapi(createInviteRoute, async (c) => {
	const user = getRequiredUser(c)
	const { orgId } = c.req.valid("param")
	const body = c.req.valid("json")

	await getOrgForUser(orgId, user.id)
	await requireOrgRole(orgId, user.id, ["owner", "admin"])

	const invitation = await createInvitation(
		orgId,
		body.email,
		body.role,
		user.name ?? user.email,
	)

	return c.json(toInvitationResponse(invitation), 201)
})

invitationRoutes.openapi(listInvitesRoute, async (c) => {
	const user = getRequiredUser(c)
	const { orgId } = c.req.valid("param")

	await getOrgForUser(orgId, user.id)
	await requireOrgRole(orgId, user.id, ["owner", "admin"])

	const invitations = await listPendingInvitations(orgId)

	return c.json({ invitations: invitations.map(toInvitationResponse) }, 200)
})

invitationRoutes.openapi(cancelInviteRoute, async (c) => {
	const user = getRequiredUser(c)
	const { orgId, inviteId } = c.req.valid("param")

	await getOrgForUser(orgId, user.id)
	await requireOrgRole(orgId, user.id, ["owner", "admin"])

	await cancelInvitation(orgId, inviteId)

	return c.body(null, 204)
})

invitationRoutes.openapi(resendInviteRoute, async (c) => {
	const user = getRequiredUser(c)
	const { orgId, inviteId } = c.req.valid("param")

	await getOrgForUser(orgId, user.id)
	await requireOrgRole(orgId, user.id, ["owner", "admin"])

	const invitation = await resendInvitation(
		orgId,
		inviteId,
		user.name ?? user.email,
	)

	return c.json(toInvitationResponse(invitation), 200)
})

invitationRoutes.openapi(acceptInviteRoute, async (c) => {
	const user = getRequiredUser(c)
	const body = c.req.valid("json")

	const result = await acceptInvitation(body.token, user.id)

	return c.json(result, 200)
})

export { invitationRoutes }
