import { z } from "@hono/zod-openapi"
import {
	errorResponseSchema,
	paginationQuerySchema,
	projectAndMaintenanceIdParamSchema,
	projectIdParamSchema,
} from "../shared/schemas.js"

export {
	errorResponseSchema,
	projectIdParamSchema,
	projectAndMaintenanceIdParamSchema as maintenanceIdParamSchema,
}

export const maintenanceResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		title: z.string(),
		description: z.string().nullable(),
		startsAt: z.string().datetime(),
		endsAt: z.string().datetime(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("Maintenance")

export type MaintenanceResponse = z.infer<typeof maintenanceResponseSchema>

export const maintenanceWithChecksResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		title: z.string(),
		description: z.string().nullable(),
		startsAt: z.string().datetime(),
		endsAt: z.string().datetime(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
		checkIds: z.array(z.string()),
	})
	.openapi("MaintenanceWithChecks")

export type MaintenanceWithChecksResponse = z.infer<
	typeof maintenanceWithChecksResponseSchema
>

export const maintenanceListResponseSchema = z
	.object({
		maintenance: z.array(maintenanceResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("MaintenanceList")

export type MaintenanceListResponse = z.infer<
	typeof maintenanceListResponseSchema
>

export const createMaintenanceBodySchema = z
	.object({
		title: z.string().min(1).max(200),
		description: z.string().max(2000).optional(),
		startsAt: z.string().datetime(),
		endsAt: z.string().datetime(),
		checkIds: z.array(z.string()).optional(),
	})
	.openapi("CreateMaintenanceRequest")

export type CreateMaintenanceBody = z.infer<typeof createMaintenanceBodySchema>

export const updateMaintenanceBodySchema = z
	.object({
		title: z.string().min(1).max(200).optional(),
		description: z.string().max(2000).nullable().optional(),
		startsAt: z.string().datetime().optional(),
		endsAt: z.string().datetime().optional(),
		checkIds: z.array(z.string()).optional(),
	})
	.openapi("UpdateMaintenanceRequest")

export type UpdateMaintenanceBody = z.infer<typeof updateMaintenanceBodySchema>

export const listMaintenanceQuerySchema = paginationQuerySchema.extend({
	upcoming: z
		.string()
		.optional()
		.transform((v) => v === "true")
		.openapi({
			param: { name: "upcoming", in: "query" },
			example: "true",
		}),
})

export type ListMaintenanceQuery = z.infer<typeof listMaintenanceQuerySchema>
