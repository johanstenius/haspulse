import { z } from "@hono/zod-openapi"
import {
	errorResponseSchema,
	paginationQuerySchema,
	projectAndChannelIdParamSchema,
	projectIdParamSchema,
} from "../shared/schemas.js"

export {
	errorResponseSchema,
	projectIdParamSchema,
	projectAndChannelIdParamSchema as channelIdParamSchema,
	paginationQuerySchema,
}

export const channelTypeSchema = z.enum([
	"EMAIL",
	"SLACK_WEBHOOK",
	"SLACK_APP",
	"DISCORD",
	"PAGERDUTY",
	"OPSGENIE",
	"WEBHOOK",
])

// Typed config schemas per channel type
export const emailConfigSchema = z
	.object({
		email: z.string().email(),
	})
	.openapi("EmailChannelConfig")

export const slackWebhookConfigSchema = z
	.object({
		webhookUrl: z.string().url(),
	})
	.openapi("SlackWebhookChannelConfig")

export const slackAppConfigSchema = z
	.object({
		accessToken: z.string().min(1),
		channelId: z.string().min(1),
		webhookUrl: z.string().url().optional(),
	})
	.openapi("SlackAppChannelConfig")

export const discordConfigSchema = z
	.object({
		webhookUrl: z.string().url(),
	})
	.openapi("DiscordChannelConfig")

export const pagerdutyConfigSchema = z
	.object({
		routingKey: z.string().min(1),
	})
	.openapi("PagerDutyChannelConfig")

export const opsgenieConfigSchema = z
	.object({
		apiKey: z.string().min(1),
		region: z.enum(["us", "eu"]).optional(),
	})
	.openapi("OpsgenieChannelConfig")

export const webhookConfigSchema = z
	.object({
		url: z.string().url(),
		secret: z.string().optional(),
	})
	.openapi("WebhookChannelConfig")

export type EmailConfig = z.infer<typeof emailConfigSchema>
export type SlackWebhookConfig = z.infer<typeof slackWebhookConfigSchema>
export type SlackAppConfig = z.infer<typeof slackAppConfigSchema>
export type DiscordConfig = z.infer<typeof discordConfigSchema>
export type PagerDutyConfig = z.infer<typeof pagerdutyConfigSchema>
export type OpsgenieConfig = z.infer<typeof opsgenieConfigSchema>
export type WebhookConfig = z.infer<typeof webhookConfigSchema>

export const channelResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		type: channelTypeSchema,
		name: z.string(),
		config: z.record(z.unknown()),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("Channel")

export type ChannelResponse = z.infer<typeof channelResponseSchema>

export const channelListResponseSchema = z
	.object({
		channels: z.array(channelResponseSchema),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
	})
	.openapi("ChannelList")

export type ChannelListResponse = z.infer<typeof channelListResponseSchema>

// Discriminated union for create channel - validates config based on type
const createEmailChannel = z.object({
	type: z.literal("EMAIL"),
	name: z.string().min(1).max(100),
	config: emailConfigSchema,
})

const createSlackWebhookChannel = z.object({
	type: z.literal("SLACK_WEBHOOK"),
	name: z.string().min(1).max(100),
	config: slackWebhookConfigSchema,
})

const createSlackAppChannel = z.object({
	type: z.literal("SLACK_APP"),
	name: z.string().min(1).max(100),
	config: slackAppConfigSchema,
})

const createDiscordChannel = z.object({
	type: z.literal("DISCORD"),
	name: z.string().min(1).max(100),
	config: discordConfigSchema,
})

const createPagerDutyChannel = z.object({
	type: z.literal("PAGERDUTY"),
	name: z.string().min(1).max(100),
	config: pagerdutyConfigSchema,
})

const createOpsgenieChannel = z.object({
	type: z.literal("OPSGENIE"),
	name: z.string().min(1).max(100),
	config: opsgenieConfigSchema,
})

const createWebhookChannel = z.object({
	type: z.literal("WEBHOOK"),
	name: z.string().min(1).max(100),
	config: webhookConfigSchema,
})

export const createChannelBodySchema = z
	.discriminatedUnion("type", [
		createEmailChannel,
		createSlackWebhookChannel,
		createSlackAppChannel,
		createDiscordChannel,
		createPagerDutyChannel,
		createOpsgenieChannel,
		createWebhookChannel,
	])
	.openapi("CreateChannelRequest")

export type CreateChannelBody = z.infer<typeof createChannelBodySchema>

// For updates, config must match one of the valid schemas
const channelConfigSchema = z.union([
	emailConfigSchema,
	slackWebhookConfigSchema,
	slackAppConfigSchema,
	discordConfigSchema,
	pagerdutyConfigSchema,
	opsgenieConfigSchema,
	webhookConfigSchema,
])

export const updateChannelBodySchema = z
	.object({
		name: z.string().min(1).max(100).optional(),
		config: channelConfigSchema.optional(),
	})
	.openapi("UpdateChannelRequest")

export type UpdateChannelBody = z.infer<typeof updateChannelBodySchema>

export const testChannelResponseSchema = z
	.object({
		success: z.boolean(),
		error: z.string().optional(),
	})
	.openapi("TestChannelResponse")

export type TestChannelResponse = z.infer<typeof testChannelResponseSchema>
