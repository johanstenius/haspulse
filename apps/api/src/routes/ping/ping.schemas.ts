import { z } from "@hono/zod-openapi"

export const pingResponseSchema = z
	.object({
		ok: z.boolean(),
	})
	.openapi("PingResponse")

export type PingResponse = z.infer<typeof pingResponseSchema>

export const pingByIdParamSchema = z.object({
	id: z
		.string()
		.min(1)
		.max(32)
		.openapi({
			param: { name: "id", in: "path" },
			example: "V1StGXR8_Z5jdHi6",
		}),
})

export const pingBySlugParamSchema = z.object({
	projectSlug: z
		.string()
		.min(1)
		.max(64)
		.openapi({
			param: { name: "projectSlug", in: "path" },
			example: "acme-prod",
		}),
	checkSlug: z
		.string()
		.min(1)
		.max(64)
		.openapi({
			param: { name: "checkSlug", in: "path" },
			example: "db-backup",
		}),
})

export const pingSignalParamSchema = z.object({
	signal: z
		.enum(["start", "fail"])
		.optional()
		.openapi({
			param: { name: "signal", in: "path" },
			example: "start",
		}),
})
