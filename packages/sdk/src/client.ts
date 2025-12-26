import { BadRequestError, HasPulseError } from "./errors.js"
import { fetchWithRetry, handleResponse } from "./http.js"
import { ApiKeysClient } from "./resources/api-keys.js"
import { ChannelsClient } from "./resources/channels.js"
import { ChecksClient } from "./resources/checks.js"
import { IncidentsClient } from "./resources/incidents.js"
import { MaintenanceClient } from "./resources/maintenance.js"
import { OrganizationsClient } from "./resources/organizations.js"
import { ProjectsClient } from "./resources/projects.js"
import type { HasPulseConfig, PingOptions } from "./types.js"

export class HasPulse {
	private readonly baseUrl: string
	private readonly apiKey: string | undefined
	private readonly timeout: number
	private readonly retries: number
	private readonly enabled: boolean

	readonly projects: ProjectsClient
	readonly checks: ChecksClient
	readonly channels: ChannelsClient
	readonly incidents: IncidentsClient
	readonly maintenance: MaintenanceClient
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
		this.incidents = new IncidentsClient(request)
		this.maintenance = new MaintenanceClient(request)
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

	async ping(checkId: string, options: PingOptions = {}): Promise<void> {
		if (!this.enabled) return

		const { type = "success", body } = options

		let path = `/ping/${checkId}`
		if (type === "start") path += "/start"
		else if (type === "fail") path += "/fail"

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
			throw new HasPulseError("Ping failed", "PING_FAILED", response.status)
		}
	}

	/**
	 * Wraps an async function with start/success/fail pings.
	 * Sends a start ping before execution, success on completion, fail on error.
	 * Rethrows the original error after sending fail ping.
	 * If no apiKey configured, just runs the function without pings.
	 */
	async wrap<T>(checkId: string, fn: () => Promise<T>): Promise<T> {
		if (!this.enabled) return fn()

		await this.ping(checkId, { type: "start" })
		try {
			const result = await fn()
			await this.ping(checkId, { type: "success" })
			return result
		} catch (error) {
			await this.ping(checkId, { type: "fail" }).catch(() => {})
			throw error
		}
	}
}
