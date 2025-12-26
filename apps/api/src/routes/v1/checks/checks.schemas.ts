import { z } from "@hono/zod-openapi"
import {
	errorResponseSchema,
	idParamSchema,
	paginationQuerySchema,
	projectIdParamSchema,
} from "../shared/schemas.js"

export {
	errorResponseSchema,
	projectIdParamSchema,
	idParamSchema as checkIdParamSchema,
}

export const checkListQuerySchema = paginationQuerySchema.extend({
	search: z
		.string()
		.optional()
		.openapi({ param: { name: "search", in: "query" }, example: "backup" }),
	status: z
		.enum(["NEW", "UP", "LATE", "DOWN", "PAUSED"])
		.optional()
		.openapi({ param: { name: "status", in: "query" }, example: "DOWN" }),
})

export type CheckListQuery = z.infer<typeof checkListQuerySchema>

export const checkStatusSchema = z.enum(["NEW", "UP", "LATE", "DOWN", "PAUSED"])
export const scheduleTypeSchema = z.enum(["PERIOD", "CRON"])
export const pingTypeSchema = z.enum(["SUCCESS", "START", "FAIL"])
export const anomalySensitivitySchema = z.enum(["LOW", "NORMAL", "HIGH"])

export const sparklineSlotSchema = z.enum([
	"success",
	"fail",
	"missed",
	"empty",
])

export const checkResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		name: z.string(),
		slug: z.string().nullable(),
		scheduleType: scheduleTypeSchema,
		scheduleValue: z.string(),
		graceSeconds: z.number(),
		timezone: z.string().nullable(),
		status: checkStatusSchema,
		lastPingAt: z.string().datetime().nullable(),
		lastStartedAt: z.string().datetime().nullable(),
		nextExpectedAt: z.string().datetime().nullable(),
		alertOnRecovery: z.boolean(),
		reminderIntervalHours: z.number().nullable(),
		anomalySensitivity: anomalySensitivitySchema,
		channelIds: z.array(z.string()),
		sparkline: z.array(sparklineSlotSchema),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("Check")

export type CheckResponse = z.infer<typeof checkResponseSchema>

export const checkListResponseSchema = z
	.object({
		checks: z.array(checkResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("CheckList")

export type CheckListResponse = z.infer<typeof checkListResponseSchema>

export const createCheckBodySchema = z
	.object({
		name: z.string().min(1).max(100),
		slug: z
			.string()
			.min(1)
			.max(64)
			.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes")
			.optional(),
		scheduleType: scheduleTypeSchema,
		scheduleValue: z.string().min(1),
		graceSeconds: z.number().min(0).max(86400).optional().default(300),
		timezone: z.string().optional(),
		alertOnRecovery: z.boolean().optional().default(true),
		reminderIntervalHours: z.number().min(1).max(168).optional(),
		anomalySensitivity: anomalySensitivitySchema.optional().default("NORMAL"),
	})
	.openapi("CreateCheckRequest")

export type CreateCheckBody = z.infer<typeof createCheckBodySchema>

export const updateCheckBodySchema = z
	.object({
		name: z.string().min(1).max(100).optional(),
		slug: z
			.string()
			.min(1)
			.max(64)
			.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes")
			.nullable()
			.optional(),
		scheduleType: scheduleTypeSchema.optional(),
		scheduleValue: z.string().min(1).optional(),
		graceSeconds: z.number().min(0).max(86400).optional(),
		timezone: z.string().nullable().optional(),
		alertOnRecovery: z.boolean().optional(),
		reminderIntervalHours: z.number().min(1).max(168).nullable().optional(),
		anomalySensitivity: anomalySensitivitySchema.optional(),
		channelIds: z.array(z.string()).optional(),
	})
	.openapi("UpdateCheckRequest")

export type UpdateCheckBody = z.infer<typeof updateCheckBodySchema>

export const durationStatsResponseSchema = z
	.object({
		current: z
			.object({
				avgMs: z.number().nullable(),
				p50Ms: z.number().nullable(),
				p95Ms: z.number().nullable(),
				p99Ms: z.number().nullable(),
				sampleCount: z.number(),
			})
			.nullable(),
		trend: z.object({
			last5: z.array(z.number()),
			direction: z.enum(["increasing", "decreasing", "stable", "unknown"]),
		}),
		isAnomaly: z.boolean(),
	})
	.openapi("DurationStats")

export type DurationStatsResponse = z.infer<typeof durationStatsResponseSchema>
