import { z } from "@hono/zod-openapi"
import {
	errorResponseSchema,
	orgAndInviteIdParamSchema,
	orgIdParamSchema,
} from "../shared/schemas.js"

export { errorResponseSchema, orgIdParamSchema, orgAndInviteIdParamSchema }

export const invitationResponseSchema = z
	.object({
		id: z.string(),
		email: z.string().email(),
		orgId: z.string(),
		role: z.string(),
		expiresAt: z.string().datetime(),
		createdAt: z.string().datetime(),
	})
	.openapi("Invitation")

export type InvitationResponse = z.infer<typeof invitationResponseSchema>

export const invitationListResponseSchema = z
	.object({
		invitations: z.array(invitationResponseSchema),
	})
	.openapi("InvitationList")

export type InvitationListResponse = z.infer<
	typeof invitationListResponseSchema
>

export const createInvitationBodySchema = z
	.object({
		email: z.string().email(),
		role: z.enum(["admin", "member"]).default("member"),
	})
	.openapi("CreateInvitationRequest")

export type CreateInvitationBody = z.infer<typeof createInvitationBodySchema>

export const acceptInvitationBodySchema = z
	.object({
		token: z.string().min(1),
	})
	.openapi("AcceptInvitationRequest")

export type AcceptInvitationBody = z.infer<typeof acceptInvitationBodySchema>

export const acceptInvitationResponseSchema = z
	.object({
		orgId: z.string(),
		role: z.string(),
	})
	.openapi("AcceptInvitationResponse")

export type AcceptInvitationResponse = z.infer<
	typeof acceptInvitationResponseSchema
>
