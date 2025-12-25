import { z } from "@hono/zod-openapi"
import {
	errorResponseSchema,
	paginationQuerySchema,
	projectAndIncidentIdParamSchema,
	projectIdParamSchema,
} from "../shared/schemas.js"

export {
	errorResponseSchema,
	projectIdParamSchema,
	projectAndIncidentIdParamSchema as incidentIdParamSchema,
}

export const incidentStatusSchema = z.enum([
	"INVESTIGATING",
	"IDENTIFIED",
	"MONITORING",
	"RESOLVED",
])

export const incidentImpactSchema = z.enum([
	"NONE",
	"MINOR",
	"MAJOR",
	"CRITICAL",
])

export const incidentUpdateResponseSchema = z
	.object({
		id: z.string(),
		incidentId: z.string(),
		status: incidentStatusSchema,
		message: z.string(),
		createdAt: z.string().datetime(),
	})
	.openapi("IncidentUpdate")

export type IncidentUpdateResponse = z.infer<
	typeof incidentUpdateResponseSchema
>

export const incidentResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		title: z.string(),
		status: incidentStatusSchema,
		impact: incidentImpactSchema,
		autoCreated: z.boolean(),
		resolvedAt: z.string().datetime().nullable(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("Incident")

export type IncidentResponse = z.infer<typeof incidentResponseSchema>

export const incidentWithUpdatesResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		title: z.string(),
		status: incidentStatusSchema,
		impact: incidentImpactSchema,
		autoCreated: z.boolean(),
		resolvedAt: z.string().datetime().nullable(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
		updates: z.array(incidentUpdateResponseSchema),
		checkIds: z.array(z.string()),
	})
	.openapi("IncidentWithUpdates")

export type IncidentWithUpdatesResponse = z.infer<
	typeof incidentWithUpdatesResponseSchema
>

export const incidentListResponseSchema = z
	.object({
		incidents: z.array(incidentResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("IncidentList")

export type IncidentListResponse = z.infer<typeof incidentListResponseSchema>

export const createIncidentBodySchema = z
	.object({
		title: z.string().min(1).max(200),
		status: incidentStatusSchema.optional(),
		impact: incidentImpactSchema.optional(),
		checkIds: z.array(z.string()).optional(),
	})
	.openapi("CreateIncidentRequest")

export type CreateIncidentBody = z.infer<typeof createIncidentBodySchema>

export const updateIncidentBodySchema = z
	.object({
		title: z.string().min(1).max(200).optional(),
		status: incidentStatusSchema.optional(),
		impact: incidentImpactSchema.optional(),
	})
	.openapi("UpdateIncidentRequest")

export type UpdateIncidentBody = z.infer<typeof updateIncidentBodySchema>

export const createIncidentUpdateBodySchema = z
	.object({
		status: incidentStatusSchema,
		message: z.string().min(1).max(2000),
	})
	.openapi("CreateIncidentUpdateRequest")

export type CreateIncidentUpdateBody = z.infer<
	typeof createIncidentUpdateBodySchema
>

export const listIncidentsQuerySchema = paginationQuerySchema.extend({
	status: incidentStatusSchema.optional().openapi({
		param: { name: "status", in: "query" },
		example: "INVESTIGATING",
	}),
})

export type ListIncidentsQuery = z.infer<typeof listIncidentsQuerySchema>
