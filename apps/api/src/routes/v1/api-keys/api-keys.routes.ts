import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { limitExceeded, notFound } from "../../../lib/errors.js"
import { checkApiKeyLimit } from "../../../lib/limits.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import {
	type ApiKeyModel,
	createApiKey,
	deleteApiKey,
	getApiKeyById,
	listApiKeys,
} from "../../../services/api-key.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	type ApiKeyResponse,
	apiKeyCreatedResponseSchema,
	apiKeyIdParamSchema,
	apiKeyListResponseSchema,
	createApiKeyBodySchema,
	errorResponseSchema,
	projectIdParamSchema,
} from "./api-keys.schemas.js"

const apiKeyRoutes = new OpenAPIHono<AuthEnv>()

apiKeyRoutes.use("*", requireAuth)

function toApiKeyResponse(apiKey: ApiKeyModel): ApiKeyResponse {
	return {
		id: apiKey.id,
		projectId: apiKey.projectId,
		name: apiKey.name,
		keyPrefix: apiKey.keyPrefix,
		lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? null,
		createdAt: apiKey.createdAt.toISOString(),
	}
}

const listApiKeysRoute = createRoute({
	method: "get",
	path: "/{projectId}/api-keys",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: apiKeyListResponseSchema } },
			description: "List of API keys",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
	},
	tags: ["API Keys"],
	summary: "List all API keys for a project",
})

const createApiKeyRoute = createRoute({
	method: "post",
	path: "/{projectId}/api-keys",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createApiKeyBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: apiKeyCreatedResponseSchema } },
			description: "API key created (full key shown only once)",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
	},
	tags: ["API Keys"],
	summary: "Create a new API key",
})

const deleteApiKeyRoute = createRoute({
	method: "delete",
	path: "/{projectId}/api-keys/{apiKeyId}",
	request: { params: apiKeyIdParamSchema },
	responses: {
		204: { description: "API key deleted" },
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "API key not found",
		},
	},
	tags: ["API Keys"],
	summary: "Delete API key",
})

apiKeyRoutes.openapi(listApiKeysRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)
	const apiKeys = await listApiKeys(projectId)
	return c.json({ apiKeys: apiKeys.map(toApiKeyResponse) }, 200)
})

apiKeyRoutes.openapi(createApiKeyRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const body = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const limitCheck = await checkApiKeyLimit(projectId, org.plan)
	if (!limitCheck.allowed) {
		throw limitExceeded(
			limitCheck.resource,
			limitCheck.limit,
			limitCheck.current,
		)
	}

	const result = await createApiKey(projectId, body.name)

	return c.json(
		{
			apiKey: toApiKeyResponse(result.apiKey),
			fullKey: result.fullKey,
		},
		201,
	)
})

apiKeyRoutes.openapi(deleteApiKeyRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, apiKeyId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)

	const apiKey = await getApiKeyById(apiKeyId)
	if (!apiKey || apiKey.projectId !== projectId) {
		throw notFound("API key not found")
	}

	await deleteApiKey(apiKeyId)
	return c.body(null, 204)
})

export { apiKeyRoutes }
