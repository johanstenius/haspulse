import { prisma } from "@haspulse/db"
import type { ApiKeyModel } from "../services/api-key.service.js"

type CreateApiKeyData = {
	projectId: string
	name: string
	keyHash: string
	keyPrefix: string
}

function toApiKeyModel(apiKey: {
	id: string
	projectId: string
	name: string
	keyPrefix: string
	lastUsedAt: Date | null
	createdAt: Date
}): ApiKeyModel {
	return {
		id: apiKey.id,
		projectId: apiKey.projectId,
		name: apiKey.name,
		keyPrefix: apiKey.keyPrefix,
		lastUsedAt: apiKey.lastUsedAt,
		createdAt: apiKey.createdAt,
	}
}

export const apiKeyRepository = {
	async create(data: CreateApiKeyData): Promise<ApiKeyModel> {
		const apiKey = await prisma.apiKey.create({
			data: {
				projectId: data.projectId,
				name: data.name,
				keyHash: data.keyHash,
				keyPrefix: data.keyPrefix,
			},
		})
		return toApiKeyModel(apiKey)
	},

	async findByHash(keyHash: string): Promise<ApiKeyModel | null> {
		const apiKey = await prisma.apiKey.findUnique({
			where: { keyHash },
		})
		return apiKey ? toApiKeyModel(apiKey) : null
	},

	async findById(id: string): Promise<ApiKeyModel | null> {
		const apiKey = await prisma.apiKey.findUnique({
			where: { id },
		})
		return apiKey ? toApiKeyModel(apiKey) : null
	},

	async findByProjectId(projectId: string): Promise<ApiKeyModel[]> {
		const apiKeys = await prisma.apiKey.findMany({
			where: { projectId },
			orderBy: { createdAt: "desc" },
		})
		return apiKeys.map(toApiKeyModel)
	},

	async updateLastUsed(id: string): Promise<void> {
		await prisma.apiKey.update({
			where: { id },
			data: { lastUsedAt: new Date() },
		})
	},

	async delete(id: string): Promise<void> {
		await prisma.apiKey.delete({
			where: { id },
		})
	},
}
