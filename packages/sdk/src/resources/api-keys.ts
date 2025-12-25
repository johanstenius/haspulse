import type { RequestFn } from "../http.js"
import type { ApiKey, ApiKeyCreated, CreateApiKeyInput } from "../types.js"

export class ApiKeysClient {
	constructor(private readonly request: RequestFn) {}

	async list(projectId: string): Promise<ApiKey[]> {
		const data = await this.request<{ apiKeys: ApiKey[] }>(
			"GET",
			`/v1/projects/${projectId}/api-keys`,
		)
		return data.apiKeys
	}

	async create(
		projectId: string,
		input: CreateApiKeyInput,
	): Promise<ApiKeyCreated> {
		return this.request<ApiKeyCreated>(
			"POST",
			`/v1/projects/${projectId}/api-keys`,
			input,
		)
	}

	async delete(projectId: string, apiKeyId: string): Promise<void> {
		await this.request<void>(
			"DELETE",
			`/v1/projects/${projectId}/api-keys/${apiKeyId}`,
		)
	}
}
