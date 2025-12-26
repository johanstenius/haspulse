// Main client
export { HasPulse } from "./client.js"

// Types
export type {
	// Config
	HasPulseConfig,
	// Projects
	Project,
	CreateProjectInput,
	UpdateProjectInput,
	// Checks
	Check,
	CheckStatus,
	ScheduleType,
	CreateCheckInput,
	UpdateCheckInput,
	CheckStats,
	UptimeDay,
	// Channels
	Channel,
	ChannelType,
	ChannelConfig,
	EmailChannelConfig,
	SlackWebhookChannelConfig,
	SlackAppChannelConfig,
	DiscordChannelConfig,
	PagerDutyChannelConfig,
	OpsgenieChannelConfig,
	WebhookChannelConfig,
	CreateChannelInput,
	UpdateChannelInput,
	// Organizations
	Organization,
	CreateOrganizationInput,
	UpdateOrganizationInput,
	// API Keys
	ApiKey,
	ApiKeyCreated,
	CreateApiKeyInput,
	// Ping
	PingOptions,
	WrapOptions,
	// Pagination
	PaginationParams,
	PaginatedResponse,
} from "./types.js"

// Pagination helpers
export { paginate, fetchAll } from "./types.js"

// Errors
export {
	HasPulseError,
	BadRequestError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
} from "./errors.js"

// Resource clients (for typing)
export { ProjectsClient } from "./resources/projects.js"
export { ChecksClient } from "./resources/checks.js"
export { ChannelsClient } from "./resources/channels.js"
export { OrganizationsClient } from "./resources/organizations.js"
export { ApiKeysClient } from "./resources/api-keys.js"
