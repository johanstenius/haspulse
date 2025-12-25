import { z } from "@hono/zod-openapi"

export const projectBadgeParamSchema = z.object({
	projectSlug: z
		.string()
		.openapi({ param: { name: "projectSlug", in: "path" } }),
})

export const checkBadgeParamSchema = z.object({
	projectSlug: z
		.string()
		.openapi({ param: { name: "projectSlug", in: "path" } }),
	checkSlug: z.string().openapi({ param: { name: "checkSlug", in: "path" } }),
})

export const badgeQuerySchema = z.object({
	label: z
		.string()
		.optional()
		.openapi({ param: { name: "label", in: "query" } }),
})

export const badgeErrorSchema = z.object({
	error: z.string(),
})
