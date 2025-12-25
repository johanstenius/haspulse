import { z } from "@hono/zod-openapi"
import {
	errorResponseSchema,
	projectAndApiKeyIdParamSchema,
	projectIdParamSchema,
} from "../shared/schemas.js"

export {
	errorResponseSchema,
	projectIdParamSchema,
	projectAndApiKeyIdParamSchema as apiKeyIdParamSchema,
}

export const apiKeyResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		name: z.string(),
		keyPrefix: z.string(),
		lastUsedAt: z.string().datetime().nullable(),
		createdAt: z.string().datetime(),
	})
	.openapi("ApiKey")

export type ApiKeyResponse = z.infer<typeof apiKeyResponseSchema>

export const apiKeyCreatedResponseSchema = z
	.object({
		apiKey: apiKeyResponseSchema,
		fullKey: z.string(),
	})
	.openapi("ApiKeyCreated")

export type ApiKeyCreatedResponse = z.infer<typeof apiKeyCreatedResponseSchema>

export const apiKeyListResponseSchema = z
	.object({
		apiKeys: z.array(apiKeyResponseSchema),
	})
	.openapi("ApiKeyList")

export type ApiKeyListResponse = z.infer<typeof apiKeyListResponseSchema>

export const createApiKeyBodySchema = z
	.object({
		name: z.string().min(1).max(100),
	})
	.openapi("CreateApiKeyRequest")

export type CreateApiKeyBody = z.infer<typeof createApiKeyBodySchema>
