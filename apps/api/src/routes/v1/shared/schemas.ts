import { z } from "@hono/zod-openapi"

export const errorResponseSchema = z
	.object({
		error: z.object({
			code: z.string(),
			message: z.string(),
		}),
	})
	.openapi("ErrorResponse")

// Common param schemas - centralized to avoid duplication
export const projectIdParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "projectId", in: "path" },
		example: "V1StGXR8_Z5jdHi6",
	})

export const idParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "id", in: "path" },
		example: "W2TtHYS9_A6kfIj7",
	})

// Check ID param (named checkId instead of id)
export const checkIdParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "checkId", in: "path" },
		example: "W2TtHYS9_A6kfIj7",
	})

export const checkIdParamSchema = z.object({ checkId: checkIdParam })

// Composed param schemas for common route patterns
export const projectIdParamSchema = z.object({ projectId: projectIdParam })

export const idParamSchema = z.object({ id: idParam })

export const projectAndIdParamSchema = z.object({
	projectId: projectIdParam,
	id: idParam,
})

// Channel params
export const channelIdParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "channelId", in: "path" },
		example: "X3UtIZT0_B7lgJk8",
	})

export const projectAndChannelIdParamSchema = z.object({
	projectId: projectIdParam,
	channelId: channelIdParam,
})

// Incident params
export const incidentIdParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "incidentId", in: "path" },
		example: "X3UtIZT0_B7lgJk8",
	})

export const projectAndIncidentIdParamSchema = z.object({
	projectId: projectIdParam,
	incidentId: incidentIdParam,
})

// Maintenance params
export const maintenanceIdParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "maintenanceId", in: "path" },
		example: "Y4VuJAU1_C8mhKl9",
	})

export const projectAndMaintenanceIdParamSchema = z.object({
	projectId: projectIdParam,
	maintenanceId: maintenanceIdParam,
})

// API Key params
export const apiKeyIdParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "apiKeyId", in: "path" },
		example: "Z5WvKBV2_D9niLm0",
	})

export const projectAndApiKeyIdParamSchema = z.object({
	projectId: projectIdParam,
	apiKeyId: apiKeyIdParam,
})

// Org ID param
export const orgIdParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "orgId", in: "path" },
		example: "clx1234567890",
	})

export const orgIdParamSchema = z.object({ orgId: orgIdParam })

// Invitation params
export const inviteIdParam = z
	.string()
	.min(1)
	.openapi({
		param: { name: "inviteId", in: "path" },
		example: "clx0987654321",
	})

export const orgAndInviteIdParamSchema = z.object({
	orgId: orgIdParam,
	inviteId: inviteIdParam,
})

// Pagination query schemas
export const paginationQuerySchema = z.object({
	page: z.coerce
		.number()
		.min(1)
		.optional()
		.default(1)
		.openapi({ param: { name: "page", in: "query" }, example: 1 }),
	limit: z.coerce
		.number()
		.min(1)
		.max(100)
		.optional()
		.default(20)
		.openapi({ param: { name: "limit", in: "query" }, example: 20 }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

// Paginated result type for services
export type PaginatedResult<T> = {
	data: T[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export function createPaginatedResult<T>(
	data: T[],
	total: number,
	page: number,
	limit: number,
): PaginatedResult<T> {
	return {
		data,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	}
}
