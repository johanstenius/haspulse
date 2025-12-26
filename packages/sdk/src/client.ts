import { BadRequestError } from "./errors.js"
import { fetchWithRetry, handleResponse } from "./http.js"
import { ApiKeysClient } from "./resources/api-keys.js"
import { ChannelsClient } from "./resources/channels.js"
import { ChecksClient } from "./resources/checks.js"
import { OrganizationsClient } from "./resources/organizations.js"
import { ProjectsClient } from "./resources/projects.js"
import type { HasPulseConfig, PingOptions, WrapOptions } from "./types.js"

export class HasPulse {
	private readonly baseUrl: string
	private readonly apiKey: string | undefined
	private readonly timeout: number
	private readonly retries: number
	private readonly enabled: boolean

	readonly projects: ProjectsClient
	readonly checks: ChecksClient
	readonly channels: ChannelsClient
	readonly organizations: OrganizationsClient
	readonly apiKeys: ApiKeysClient

	constructor(config: HasPulseConfig = {}) {
		if (config.apiKey && !config.apiKey.startsWith("hp_")) {
			throw new BadRequestError(
				"Invalid API key format. Expected key starting with 'hp_'",
			)
		}

		this.apiKey = config.apiKey
		this.enabled = !!config.apiKey
		this.baseUrl = config.baseUrl ?? "https://api.haspulse.dev"
		this.timeout = config.timeout ?? 30000
		this.retries = config.retries ?? 2

		const request = this.request.bind(this)
		this.projects = new ProjectsClient(request)
		this.checks = new ChecksClient(request)
		this.channels = new ChannelsClient(request)
		this.organizations = new OrganizationsClient(request)
		this.apiKeys = new ApiKeysClient(request)
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
	): Promise<T> {
		if (!this.enabled) {
			throw new BadRequestError(
				"API key is required for management APIs. Set apiKey in HasPulse config.",
			)
		}
		const response = await fetchWithRetry(
			`${this.baseUrl}${path}`,
			{
				method,
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
				},
				body: body ? JSON.stringify(body) : undefined,
			},
			this.timeout,
			this.retries,
		)
		return handleResponse<T>(response)
	}

	async ping(slug: string, options: PingOptions = {}): Promise<void> {
		if (!this.enabled) return

		const { type = "success", body } = options

		let path = `/ping/${slug}`
		if (type === "start") path += "/start"
		else if (type === "fail") path += "/fail"

		try {
			const response = await fetchWithRetry(
				`${this.baseUrl}${path}`,
				{
					method: body ? "POST" : "GET",
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
					},
					body: body ?? undefined,
				},
				this.timeout,
				this.retries,
			)

			if (!response.ok) {
				console.warn(`[haspulse] ping failed for "${slug}": ${response.status}`)
			}
		} catch (error) {
			console.warn(
				`[haspulse] ping failed for "${slug}": ${error instanceof Error ? error.message : "Unknown error"}`,
			)
		}
	}

	/**
	 * Wraps an async function with success/fail pings.
	 * Optionally sends a start ping before execution for duration tracking.
	 * Rethrows the original error after sending fail ping.
	 * If no apiKey configured, just runs the function without pings.
	 */
	async wrap<T>(
		slug: string,
		fn: () => Promise<T>,
		options: WrapOptions = {},
	): Promise<T> {
		if (!this.enabled) return fn()

		const { trackDuration = false } = options

		if (trackDuration) {
			await this.ping(slug, { type: "start" })
		}
		try {
			const result = await fn()
			await this.ping(slug, { type: "success" })
			return result
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? `${error.name}: ${error.message}`
					: String(error)
			await this.ping(slug, { type: "fail", body: errorMessage })
			throw error
		}
	}
}
