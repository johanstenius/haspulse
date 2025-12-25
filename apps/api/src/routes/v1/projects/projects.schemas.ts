import { z } from "@hono/zod-openapi"
import {
	errorResponseSchema,
	idParamSchema,
	paginationQuerySchema,
} from "../shared/schemas.js"

export {
	errorResponseSchema,
	idParamSchema as projectIdParamSchema,
	paginationQuerySchema,
}

export const projectResponseSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
		timezone: z.string(),
		statusPageEnabled: z.boolean(),
		statusPageTitle: z.string().nullable(),
		statusPageLogoUrl: z.string().nullable(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("Project")

export type ProjectResponse = z.infer<typeof projectResponseSchema>

export const projectListResponseSchema = z
	.object({
		projects: z.array(projectResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("ProjectList")

export type ProjectListResponse = z.infer<typeof projectListResponseSchema>

export const createProjectBodySchema = z
	.object({
		name: z.string().min(1).max(100),
		slug: z
			.string()
			.min(1)
			.max(64)
			.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
		timezone: z.string().optional().default("UTC"),
	})
	.openapi("CreateProjectRequest")

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>

export const updateProjectBodySchema = z
	.object({
		name: z.string().min(1).max(100).optional(),
		slug: z
			.string()
			.min(1)
			.max(64)
			.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes")
			.optional(),
		timezone: z.string().optional(),
		statusPageEnabled: z.boolean().optional(),
		statusPageTitle: z.string().max(200).nullable().optional(),
		statusPageLogoUrl: z.string().url().nullable().optional(),
	})
	.openapi("UpdateProjectRequest")

export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>
