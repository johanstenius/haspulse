import { z } from "@hono/zod-openapi"
import { errorResponseSchema, idParamSchema } from "../shared/schemas.js"

export { errorResponseSchema, idParamSchema as checkIdParamSchema }

export const pingTypeSchema = z.enum(["SUCCESS", "START", "FAIL"])

export const pingResponseSchema = z
	.object({
		id: z.string(),
		checkId: z.string(),
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
	})
	.openapi("PingList")

export type PingListResponse = z.infer<typeof pingListResponseSchema>

export const pingQuerySchema = z.object({
	limit: z.coerce
		.number()
		.min(1)
		.max(100)
		.optional()
		.default(50)
		.openapi({
			param: { name: "limit", in: "query" },
			example: 50,
		}),
})
