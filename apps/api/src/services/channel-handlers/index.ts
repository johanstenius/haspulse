import type { ChannelType } from "@haspulse/db"
import { discordHandler } from "./discord.handler.js"
import { emailHandler } from "./email.handler.js"
import { opsgenieHandler } from "./opsgenie.handler.js"
import { pagerdutyHandler } from "./pagerduty.handler.js"
import { slackAppHandler } from "./slack-app.handler.js"
import { slackWebhookHandler } from "./slack-webhook.handler.js"
import type { ChannelHandler } from "./types.js"
import { webhookHandler } from "./webhook.handler.js"

export type {
	AlertContext,
	AlertEvent,
	AlertPayload,
	SendResult,
} from "./types.js"

const handlers: Record<ChannelType, ChannelHandler> = {
	EMAIL: emailHandler,
	SLACK_WEBHOOK: slackWebhookHandler,
	SLACK_APP: slackAppHandler,
	DISCORD: discordHandler,
	PAGERDUTY: pagerdutyHandler,
	OPSGENIE: opsgenieHandler,
	WEBHOOK: webhookHandler,
}

export function getHandler(type: ChannelType): ChannelHandler | undefined {
	return handlers[type]
}
