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
	idParamSchema as httpMonitorIdParamSchema,
}

export const httpMonitorListQuerySchema = paginationQuerySchema.extend({
	search: z
		.string()
		.optional()
		.openapi({ param: { name: "search", in: "query" }, example: "api" }),
	status: z
		.enum(["NEW", "UP", "LATE", "DOWN", "PAUSED"])
		.optional()
		.openapi({ param: { name: "status", in: "query" }, example: "DOWN" }),
})

export type HttpMonitorListQuery = z.infer<typeof httpMonitorListQuerySchema>

export const monitorStatusSchema = z.enum([
	"NEW",
	"UP",
	"LATE",
	"DOWN",
	"PAUSED",
])

export const sparklineSlotSchema = z.enum([
	"success",
	"fail",
	"missed",
	"empty",
])

export const httpMonitorResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		name: z.string(),
		url: z.string(),
		method: z.string(),
		headers: z.record(z.string()).nullable(),
		body: z.string().nullable(),
		timeout: z.number(),
		expectedStatus: z.number(),
		expectedBody: z.string().nullable(),
		interval: z.number(),
		graceSeconds: z.number(),
		status: monitorStatusSchema,
		lastCheckedAt: z.string().datetime().nullable(),
		lastResponseMs: z.number().nullable(),
		nextCheckAt: z.string().datetime().nullable(),
		alertOnRecovery: z.boolean(),
		channelIds: z.array(z.string()),
		sparkline: z.array(sparklineSlotSchema),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("HttpMonitor")

export type HttpMonitorResponse = z.infer<typeof httpMonitorResponseSchema>

export const httpMonitorListResponseSchema = z
	.object({
		httpMonitors: z.array(httpMonitorResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("HttpMonitorList")

export type HttpMonitorListResponse = z.infer<
	typeof httpMonitorListResponseSchema
>

export const createHttpMonitorBodySchema = z
	.object({
		name: z.string().min(1).max(100),
		url: z.string().url(),
		method: z
			.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
			.optional()
			.default("GET"),
		headers: z.record(z.string()).optional(),
		body: z.string().optional(),
		timeout: z.number().min(1).max(120).optional().default(30),
		expectedStatus: z.number().min(100).max(599).optional().default(200),
		expectedBody: z.string().optional(),
		interval: z.number().min(30).max(3600).optional().default(60),
		graceSeconds: z.number().min(0).max(3600).optional().default(60),
		alertOnRecovery: z.boolean().optional().default(true),
	})
	.openapi("CreateHttpMonitorRequest")

export type CreateHttpMonitorBody = z.infer<typeof createHttpMonitorBodySchema>

export const updateHttpMonitorBodySchema = z
	.object({
		name: z.string().min(1).max(100).optional(),
		url: z.string().url().optional(),
		method: z
			.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
			.optional(),
		headers: z.record(z.string()).nullable().optional(),
		body: z.string().nullable().optional(),
		timeout: z.number().min(1).max(120).optional(),
		expectedStatus: z.number().min(100).max(599).optional(),
		expectedBody: z.string().nullable().optional(),
		interval: z.number().min(30).max(3600).optional(),
		graceSeconds: z.number().min(0).max(3600).optional(),
		alertOnRecovery: z.boolean().optional(),
		channelIds: z.array(z.string()).optional(),
	})
	.openapi("UpdateHttpMonitorRequest")

export type UpdateHttpMonitorBody = z.infer<typeof updateHttpMonitorBodySchema>
