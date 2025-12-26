import { z } from "@hono/zod-openapi"

export const pingResponseSchema = z
	.object({
		ok: z.boolean(),
	})
	.openapi("PingResponse")

export type PingResponse = z.infer<typeof pingResponseSchema>

export const pingParamSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(64)
		.openapi({
			param: { name: "slug", in: "path" },
			example: "daily-backup",
		}),
})
