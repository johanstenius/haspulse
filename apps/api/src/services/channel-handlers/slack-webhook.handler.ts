import {
	type SlackWebhookConfig,
	slackWebhookConfigSchema,
} from "../../routes/v1/channels/channels.schemas.js"
import {
	type AlertContext,
	type ChannelHandler,
	type SendResult,
	eventDisplayName,
	getErrorMessage,
	parseConfig,
} from "./types.js"

async function send(ctx: AlertContext): Promise<SendResult> {
	const config = parseConfig<SlackWebhookConfig>(
		slackWebhookConfigSchema,
		ctx.channel.config,
		"SLACK_WEBHOOK",
	)
	const status = eventDisplayName(ctx.event)
	const emoji = ctx.event === "check.up" ? ":white_check_mark:" : ":x:"

	const message = {
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
	}

	try {
		const response = await fetch(config.webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(message),
		})

		if (!response.ok) {
			return { success: false, error: `Slack returned ${response.status}` }
		}
		return { success: true }
	} catch (err) {
		return { success: false, error: getErrorMessage(err) }
	}
}

export const slackWebhookHandler: ChannelHandler = { send }
