import { createHash, randomBytes } from "node:crypto"
import { apiKeyRepository } from "../repositories/api-key.repository.js"

export type ApiKeyModel = {
	id: string
	projectId: string
	name: string
	keyPrefix: string
	lastUsedAt: Date | null
	createdAt: Date
}

export type CreateApiKeyResult = {
	apiKey: ApiKeyModel
	fullKey: string
}

function generateKey(): string {
	const bytes = randomBytes(24)
	return `hp_live_${bytes.toString("base64url")}`
}

function hashKey(key: string): string {
	return createHash("sha256").update(key).digest("hex")
}

function getKeyPrefix(key: string): string {
	return `${key.slice(0, 12)}...`
}

export async function createApiKey(
	projectId: string,
	name: string,
): Promise<CreateApiKeyResult> {
	const fullKey = generateKey()
	const keyHash = hashKey(fullKey)
	const keyPrefix = getKeyPrefix(fullKey)

	const apiKey = await apiKeyRepository.create({
		projectId,
		name,
		keyHash,
		keyPrefix,
	})

	return { apiKey, fullKey }
}

export async function validateApiKey(key: string): Promise<ApiKeyModel | null> {
	if (!key.startsWith("hp_live_")) {
		return null
	}

	const keyHash = hashKey(key)
	const apiKey = await apiKeyRepository.findByHash(keyHash)

	if (apiKey) {
		// Update last used (fire and forget)
		void apiKeyRepository.updateLastUsed(apiKey.id)
	}

	return apiKey
}

export async function listApiKeys(projectId: string): Promise<ApiKeyModel[]> {
	return apiKeyRepository.findByProjectId(projectId)
}

export async function deleteApiKey(id: string): Promise<void> {
	await apiKeyRepository.delete(id)
}

export async function getApiKeyById(id: string): Promise<ApiKeyModel | null> {
	return apiKeyRepository.findById(id)
}
