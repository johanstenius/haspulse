// Config
export type HasPulseConfig = {
	apiKey?: string
	baseUrl?: string
	timeout?: number
	retries?: number
}

// Project types
export type Project = {
	id: string
	name: string
	slug: string
	orgId: string
	timezone: string
	statusPageEnabled: boolean
	statusPageTitle: string | null
	statusPageLogoUrl: string | null
	createdAt: string
	updatedAt: string
}

export type CreateProjectInput = {
	name: string
	slug: string
	orgId: string
	timezone?: string
}

export type UpdateProjectInput = {
	name?: string
	timezone?: string
	statusPageEnabled?: boolean
	statusPageTitle?: string | null
	statusPageLogoUrl?: string | null
}

// Check types
export type CheckStatus = "NEW" | "UP" | "LATE" | "DOWN" | "PAUSED"
export type ScheduleType = "PERIOD" | "CRON"

export type Check = {
	id: string
	projectId: string
	name: string
	slug: string | null
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds: number
	timezone: string | null
	status: CheckStatus
	lastPingAt: string | null
	nextExpectedAt: string | null
	alertOnRecovery: boolean
	reminderIntervalHours: number | null
	channelIds: string[]
	createdAt: string
	updatedAt: string
}

export type CreateCheckInput = {
	name: string
	slug?: string
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds?: number
	timezone?: string
	alertOnRecovery?: boolean
	reminderIntervalHours?: number
}

export type UpdateCheckInput = Partial<CreateCheckInput> & {
	channelIds?: string[]
}

// Channel types
export type ChannelType =
	| "EMAIL"
	| "SLACK_WEBHOOK"
	| "SLACK_APP"
	| "DISCORD"
	| "PAGERDUTY"
	| "OPSGENIE"
	| "WEBHOOK"

// Typed channel configs
export type EmailChannelConfig = {
	email: string
}

export type SlackWebhookChannelConfig = {
	webhookUrl: string
}

export type SlackAppChannelConfig = {
	accessToken: string
	channelId: string
	webhookUrl?: string
}

export type DiscordChannelConfig = {
	webhookUrl: string
}

export type PagerDutyChannelConfig = {
	routingKey: string
}

export type OpsgenieChannelConfig = {
	apiKey: string
	region?: "us" | "eu"
}

export type WebhookChannelConfig = {
	url: string
	secret?: string
}

export type ChannelConfig =
	| EmailChannelConfig
	| SlackWebhookChannelConfig
	| SlackAppChannelConfig
	| DiscordChannelConfig
	| PagerDutyChannelConfig
	| OpsgenieChannelConfig
	| WebhookChannelConfig

export type Channel = {
	id: string
	projectId: string
	type: ChannelType
	name: string
	config: ChannelConfig
	createdAt: string
	updatedAt: string
}

// Discriminated union for creating channels with type-safe configs
export type CreateChannelInput =
	| { type: "EMAIL"; name: string; config: EmailChannelConfig }
	| { type: "SLACK_WEBHOOK"; name: string; config: SlackWebhookChannelConfig }
	| { type: "SLACK_APP"; name: string; config: SlackAppChannelConfig }
	| { type: "DISCORD"; name: string; config: DiscordChannelConfig }
	| { type: "PAGERDUTY"; name: string; config: PagerDutyChannelConfig }
	| { type: "OPSGENIE"; name: string; config: OpsgenieChannelConfig }
	| { type: "WEBHOOK"; name: string; config: WebhookChannelConfig }

export type UpdateChannelInput = {
	name?: string
	config?: ChannelConfig
}

// Incident types
export type IncidentStatus =
	| "INVESTIGATING"
	| "IDENTIFIED"
	| "MONITORING"
	| "RESOLVED"
export type IncidentImpact = "NONE" | "MINOR" | "MAJOR" | "CRITICAL"

export type IncidentUpdate = {
	id: string
	incidentId: string
	status: IncidentStatus
	message: string
	createdAt: string
}

export type Incident = {
	id: string
	projectId: string
	title: string
	status: IncidentStatus
	impact: IncidentImpact
	autoCreated: boolean
	resolvedAt: string | null
	createdAt: string
	updatedAt: string
}

export type IncidentWithUpdates = Incident & {
	updates: IncidentUpdate[]
	checkIds: string[]
}

export type CreateIncidentInput = {
	title: string
	status?: IncidentStatus
	impact?: IncidentImpact
	checkIds?: string[]
}

export type UpdateIncidentInput = {
	title?: string
	status?: IncidentStatus
	impact?: IncidentImpact
}

export type CreateIncidentUpdateInput = {
	status: IncidentStatus
	message: string
}

// Maintenance types
export type Maintenance = {
	id: string
	projectId: string
	title: string
	description: string | null
	startsAt: string
	endsAt: string
	createdAt: string
	updatedAt: string
}

export type MaintenanceWithChecks = Maintenance & {
	checkIds: string[]
}

export type CreateMaintenanceInput = {
	title: string
	description?: string
	startsAt: string
	endsAt: string
	checkIds?: string[]
}

export type UpdateMaintenanceInput = {
	title?: string
	description?: string | null
	startsAt?: string
	endsAt?: string
	checkIds?: string[]
}

// Organization types
export type Organization = {
	id: string
	name: string
	slug: string
	plan: string
	trialEndsAt: string | null
	autoCreateIncidents: boolean
	createdAt: string
	updatedAt: string
}

export type CreateOrganizationInput = {
	name: string
	slug: string
}

export type UpdateOrganizationInput = {
	name?: string
	autoCreateIncidents?: boolean
}

// API Key types
export type ApiKey = {
	id: string
	projectId: string
	name: string
	prefix: string
	createdAt: string
	lastUsedAt: string | null
}

export type ApiKeyCreated = ApiKey & {
	key: string
}

export type CreateApiKeyInput = {
	name: string
}

// Stats types
export type UptimeDay = {
	date: string
	upPercent: number
	upMinutes: number
	downMinutes: number
	totalPings: number
}

export type CheckStats = {
	checkId: string
	days: UptimeDay[]
}

// Ping types
export type PingOptions = {
	type?: "success" | "start" | "fail"
	body?: string
}

export type WrapOptions = {
	/** Send START ping before execution to track duration. Default: false */
	trackDuration?: boolean
}

// Pagination types
export type PaginationParams = {
	page?: number
	limit?: number
}

export type PaginatedResponse<T> = {
	data: T[]
	total: number
	page: number
	limit: number
	totalPages: number
}

/**
 * Creates an async generator that iterates through all pages of a paginated endpoint.
 * @example
 * for await (const project of paginate(params => client.projects.list(params))) {
 *   console.log(project.name)
 * }
 */
export async function* paginate<T>(
	fetcher: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
	params?: Omit<PaginationParams, "page">,
): AsyncGenerator<T, void, unknown> {
	let page = 1
	const limit = params?.limit ?? 20

	while (true) {
		const response = await fetcher({ page, limit })
		for (const item of response.data) {
			yield item
		}
		if (page >= response.totalPages) break
		page++
	}
}

/**
 * Fetches all items from a paginated endpoint into an array.
 * @example
 * const allProjects = await fetchAll(params => client.projects.list(params))
 */
export async function fetchAll<T>(
	fetcher: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
	params?: Omit<PaginationParams, "page">,
): Promise<T[]> {
	const items: T[] = []
	for await (const item of paginate(fetcher, params)) {
		items.push(item)
	}
	return items
}
