import { z } from "@hono/zod-openapi"
import {
	errorResponseSchema,
	idParamSchema,
	paginationQuerySchema,
} from "../shared/schemas.js"

export { errorResponseSchema, idParamSchema as cronJobIdParamSchema }

export const pingTypeSchema = z.enum(["SUCCESS", "START", "FAIL"])

export const pingResponseSchema = z
	.object({
		id: z.string(),
		cronJobId: z.string(),
		type: pingTypeSchema,
		body: z.string().nullable(),
		sourceIp: z.string(),
		createdAt: z.string().datetime(),
	})
	.openapi("PingEntry")

export type PingEntryResponse = z.infer<typeof pingResponseSchema>

export const pingListResponseSchema = z
	.object({
		pings: z.array(pingResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("PingList")

export type PingListResponse = z.infer<typeof pingListResponseSchema>

export const pingQuerySchema = paginationQuerySchema
