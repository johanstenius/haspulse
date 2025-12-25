import { z } from "@hono/zod-openapi"
import { checkStatusSchema } from "../v1/checks/checks.schemas.js"
import {
	incidentImpactSchema,
	incidentStatusSchema,
} from "../v1/incidents/incidents.schemas.js"

export const statusErrorSchema = z
	.object({
		error: z.string(),
	})
	.openapi("StatusError")

export const statusProjectSlugParamSchema = z.object({
	slug: z
		.string()
		.min(1)
		.openapi({
			param: { name: "slug", in: "path" },
			example: "my-project",
		}),
})

export const statusDomainQuerySchema = z.object({
	domain: z
		.string()
		.min(1)
		.openapi({
			param: { name: "domain", in: "query" },
			example: "status.example.com",
		}),
})

export const dayStatusSchema = z.object({
	date: z.string(),
	upPercent: z.number(),
})

export const statusCheckSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: checkStatusSchema,
	lastPingAt: z.string().datetime().nullable(),
	uptimeDays: z.array(dayStatusSchema),
})

export const statusIncidentUpdateSchema = z.object({
	id: z.string(),
	status: incidentStatusSchema,
	message: z.string(),
	createdAt: z.string().datetime(),
})

export const statusIncidentSchema = z.object({
	id: z.string(),
	title: z.string(),
	status: incidentStatusSchema,
	impact: incidentImpactSchema,
	createdAt: z.string().datetime(),
	resolvedAt: z.string().datetime().nullable(),
	updates: z.array(statusIncidentUpdateSchema),
})

export const statusMaintenanceSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	startsAt: z.string().datetime(),
	endsAt: z.string().datetime(),
})

export const statusPageResponseSchema = z
	.object({
		project: z.object({
			name: z.string(),
			slug: z.string(),
			statusPageTitle: z.string().nullable(),
			statusPageLogoUrl: z.string().nullable(),
		}),
		checks: z.array(statusCheckSchema),
		activeIncidents: z.array(statusIncidentSchema),
		activeMaintenance: z.array(statusMaintenanceSchema),
		upcomingMaintenance: z.array(statusMaintenanceSchema),
	})
	.openapi("StatusPageResponse")

export type StatusPageResponse = z.infer<typeof statusPageResponseSchema>
