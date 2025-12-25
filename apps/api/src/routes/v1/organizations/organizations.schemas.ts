import { z } from "@hono/zod-openapi"
import { errorResponseSchema, idParamSchema } from "../shared/schemas.js"

export { errorResponseSchema, idParamSchema as orgIdParamSchema }

export const orgResponseSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
		plan: z.string(),
		trialEndsAt: z.string().datetime().nullable(),
		autoCreateIncidents: z.boolean(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("Organization")

export type OrgResponse = z.infer<typeof orgResponseSchema>

export const orgListResponseSchema = z
	.object({
		organizations: z.array(orgResponseSchema),
	})
	.openapi("OrganizationList")

export type OrgListResponse = z.infer<typeof orgListResponseSchema>

export const orgMemberResponseSchema = z
	.object({
		id: z.string(),
		userId: z.string(),
		role: z.string(),
		createdAt: z.string().datetime(),
	})
	.openapi("OrganizationMember")

export type OrgMemberResponse = z.infer<typeof orgMemberResponseSchema>

export const orgMemberListResponseSchema = z
	.object({
		members: z.array(orgMemberResponseSchema),
	})
	.openapi("OrganizationMemberList")

export const createOrgBodySchema = z
	.object({
		name: z.string().min(1).max(100),
		slug: z
			.string()
			.min(1)
			.max(64)
			.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
	})
	.openapi("CreateOrganizationRequest")

export type CreateOrgBody = z.infer<typeof createOrgBodySchema>

export const updateOrgBodySchema = z
	.object({
		name: z.string().min(1).max(100).optional(),
		slug: z
			.string()
			.min(1)
			.max(64)
			.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes")
			.optional(),
		autoCreateIncidents: z.boolean().optional(),
	})
	.openapi("UpdateOrganizationRequest")

export type UpdateOrgBody = z.infer<typeof updateOrgBodySchema>
