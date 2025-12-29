import { z } from "@hono/zod-openapi"

export const incidentStatusSchema = z.enum([
	"INVESTIGATING",
	"IDENTIFIED",
	"MONITORING",
	"RESOLVED",
])

export const incidentSeveritySchema = z.enum(["MINOR", "MAJOR", "CRITICAL"])

export const incidentUpdateResponseSchema = z
	.object({
		id: z.string(),
		incidentId: z.string(),
		status: incidentStatusSchema,
		message: z.string(),
		createdAt: z.string(),
	})
	.openapi("IncidentUpdate")

export const incidentResponseSchema = z
	.object({
		id: z.string(),
		statusPageId: z.string(),
		title: z.string(),
		status: incidentStatusSchema,
		severity: incidentSeveritySchema,
		componentIds: z.array(z.string()),
		autoCreated: z.boolean(),
		sourceCronJobId: z.string().nullable(),
		sourceHttpMonitorId: z.string().nullable(),
		startsAt: z.string(),
		resolvedAt: z.string().nullable(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("Incident")

export const incidentWithUpdatesResponseSchema = incidentResponseSchema
	.extend({
		updates: z.array(incidentUpdateResponseSchema),
	})
	.openapi("IncidentWithUpdates")

export const createIncidentSchema = z
	.object({
		title: z.string().min(1).max(200),
		severity: incidentSeveritySchema,
		componentIds: z.array(z.string()).min(1),
		initialMessage: z.string().max(2000).optional(),
	})
	.openapi("CreateIncident")

export const updateIncidentSchema = z
	.object({
		title: z.string().min(1).max(200).optional(),
		severity: incidentSeveritySchema.optional(),
		componentIds: z.array(z.string()).min(1).optional(),
	})
	.openapi("UpdateIncident")

export const createIncidentUpdateSchema = z
	.object({
		status: incidentStatusSchema,
		message: z.string().min(1).max(2000),
	})
	.openapi("CreateIncidentUpdate")

export const incidentsListResponseSchema = z
	.object({
		incidents: z.array(incidentResponseSchema),
		total: z.number(),
	})
	.openapi("IncidentsList")

export const incidentsListWithUpdatesResponseSchema = z
	.object({
		incidents: z.array(incidentWithUpdatesResponseSchema),
	})
	.openapi("IncidentsListWithUpdates")

export type IncidentStatus = z.infer<typeof incidentStatusSchema>
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>
export type IncidentResponse = z.infer<typeof incidentResponseSchema>
export type IncidentUpdateResponse = z.infer<
	typeof incidentUpdateResponseSchema
>
export type IncidentWithUpdatesResponse = z.infer<
	typeof incidentWithUpdatesResponseSchema
>
