import {
	type SlackAppConfig,
	slackAppConfigSchema,
} from "../../routes/v1/channels/channels.schemas.js"
import { slackWebhookHandler } from "./slack-webhook.handler.js"
import {
	type AlertContext,
	type ChannelHandler,
	type SendResult,
	eventDisplayName,
	getErrorMessage,
	parseConfig,
} from "./types.js"

const slackApiResponseSchema = {
	safeParse(data: unknown): {
		success: boolean
		data?: { ok: boolean; error?: string }
		error?: { message: string }
	} {
		if (typeof data !== "object" || data === null) {
			return { success: false, error: { message: "Invalid response" } }
		}
		const obj = data as Record<string, unknown>
		if (typeof obj.ok !== "boolean") {
			return { success: false, error: { message: "Missing ok field" } }
		}
		return {
			success: true,
			data: {
				ok: obj.ok,
				error: typeof obj.error === "string" ? obj.error : undefined,
			},
		}
	},
}

async function send(ctx: AlertContext): Promise<SendResult> {
	const config = parseConfig<SlackAppConfig>(
		slackAppConfigSchema,
		ctx.channel.config,
		"SLACK_APP",
	)

	// Prefer webhook URL if available (faster, no rate limits)
	if (config.webhookUrl) {
		return slackWebhookHandler.send({
			...ctx,
			channel: { ...ctx.channel, config: { webhookUrl: config.webhookUrl } },
		})
	}

	// Fallback to chat.postMessage API
	const status = eventDisplayName(ctx.event)
	const emoji = ctx.event === "check.up" ? ":white_check_mark:" : ":x:"

	try {
		const response = await fetch("https://slack.com/api/chat.postMessage", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.accessToken}`,
			},
			body: JSON.stringify({
				channel: config.channelId,
				text: `${emoji} *${ctx.check.name}* is ${status}`,
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `${emoji} *${ctx.check.name}* is ${status}\nProject: ${ctx.project.name}`,
						},
					},
				],
			}),
		})

		const json: unknown = await response.json()
		const parsed = slackApiResponseSchema.safeParse(json)
		if (!parsed.success || !parsed.data) {
			return { success: false, error: "Invalid Slack API response" }
		}
		return parsed.data.ok
			? { success: true }
			: { success: false, error: parsed.data.error }
	} catch (err) {
		return { success: false, error: getErrorMessage(err) }
	}
}

export const slackAppHandler: ChannelHandler = { send }
