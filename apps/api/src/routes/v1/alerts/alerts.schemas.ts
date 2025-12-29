import { z } from "@hono/zod-openapi"
import {
	cronJobIdParamSchema,
	errorResponseSchema,
	paginationQuerySchema,
} from "../shared/schemas.js"

export { errorResponseSchema, cronJobIdParamSchema }

export const alertEventSchema = z.enum([
	"cronJob.down",
	"cronJob.up",
	"cronJob.still_down",
	"cronJob.fail",
])

export const alertChannelSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.string(),
})

export const durationContextSchema = z.object({
	lastDurationMs: z.number().nullable(),
	last5Durations: z.array(z.number()),
	avgDurationMs: z.number().nullable(),
	trendDirection: z.enum(["increasing", "decreasing", "stable", "unknown"]),
	isAnomaly: z.boolean(),
	anomalyType: z.enum(["zscore", "drift"]).optional(),
	zScore: z.number().optional(),
})

export const errorPatternContextSchema = z.object({
	lastErrorSnippet: z.string().nullable(),
	errorCount24h: z.number(),
})

export const correlationContextSchema = z.object({
	relatedFailures: z.array(
		z.object({
			cronJobId: z.string(),
			cronJobName: z.string(),
			failedAt: z.string().datetime(),
		}),
	),
})

export const alertContextSchema = z
	.object({
		duration: durationContextSchema.optional(),
		errorPattern: errorPatternContextSchema.optional(),
		correlation: correlationContextSchema.optional(),
	})
	.openapi("AlertContext")

export type AlertContext = z.infer<typeof alertContextSchema>

export const alertResponseSchema = z
	.object({
		id: z.string(),
		cronJobId: z.string(),
		event: alertEventSchema,
		channels: z.array(alertChannelSchema),
		context: alertContextSchema.nullable(),
		success: z.boolean(),
		error: z.string().nullable(),
		createdAt: z.string().datetime(),
	})
	.openapi("Alert")

export type AlertResponse = z.infer<typeof alertResponseSchema>

export const alertWithCronJobResponseSchema = alertResponseSchema
	.extend({
		cronJobName: z.string(),
		projectId: z.string(),
		projectName: z.string(),
	})
	.openapi("AlertWithCronJob")

export type AlertWithCronJobResponse = z.infer<
	typeof alertWithCronJobResponseSchema
>

export const alertFiltersQuerySchema = paginationQuerySchema.extend({
	event: alertEventSchema.optional().openapi({
		param: { name: "event", in: "query" },
		example: "cronJob.down",
	}),
	fromDate: z
		.string()
		.datetime()
		.optional()
		.openapi({
			param: { name: "fromDate", in: "query" },
			example: "2024-01-01T00:00:00Z",
		}),
	toDate: z
		.string()
		.datetime()
		.optional()
		.openapi({
			param: { name: "toDate", in: "query" },
			example: "2024-12-31T23:59:59Z",
		}),
})

export type AlertFiltersQuery = z.infer<typeof alertFiltersQuerySchema>

export const alertOrgFiltersQuerySchema = alertFiltersQuerySchema.extend({
	projectId: z
		.string()
		.optional()
		.openapi({
			param: { name: "projectId", in: "query" },
			example: "V1StGXR8_Z5jdHi6",
		}),
	cronJobId: z
		.string()
		.optional()
		.openapi({
			param: { name: "cronJobId", in: "query" },
			example: "W2TtHYS9_A6kfIj7",
		}),
})

export type AlertOrgFiltersQuery = z.infer<typeof alertOrgFiltersQuerySchema>

export const cronJobAlertsListResponseSchema = z
	.object({
		alerts: z.array(alertResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("CronJobAlertsList")

export type CronJobAlertsListResponse = z.infer<
	typeof cronJobAlertsListResponseSchema
>

export const alertsListResponseSchema = z
	.object({
		alerts: z.array(alertWithCronJobResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("AlertsList")

export type AlertsListResponse = z.infer<typeof alertsListResponseSchema>
