import {
	type SlackWebhookConfig,
	slackWebhookConfigSchema,
} from "../../routes/v1/channels/channels.schemas.js"
import {
	type AlertContext,
	type ChannelHandler,
	type RichAlertContext,
	type SendResult,
	eventDisplayName,
	getErrorMessage,
	getMonitorName,
	isRecoveryEvent,
	parseConfig,
} from "./types.js"

export function formatContextBlocks(
	richContext: RichAlertContext | undefined,
): Array<{ type: string; text: { type: string; text: string } }> {
	const blocks: Array<{ type: string; text: { type: string; text: string } }> =
		[]

	if (richContext?.duration) {
		const d = richContext.duration
		let durationText = ""

		if (d.lastDurationMs !== null) {
			const durationSec = Math.round(d.lastDurationMs / 1000)
			durationText = `📊 *Duration:* ${durationSec}s`
			if (d.avgDurationMs) {
				const avgSec = Math.round(d.avgDurationMs / 1000)
				const diff = Math.round(
					((d.lastDurationMs - d.avgDurationMs) / d.avgDurationMs) * 100,
				)
				const trend = diff > 0 ? `+${diff}%` : `${diff}%`
				durationText += ` (avg: ${avgSec}s, ${trend})`
			}
			if (d.isAnomaly) {
				durationText += " ⚠️"
			}
		}

		if (d.last5Durations.length > 0) {
			const trend = d.last5Durations
				.map((ms) => `${Math.round(ms / 1000)}s`)
				.join(" → ")
			durationText += `\n📈 *Trend:* ${trend}`
		}

		if (durationText) {
			blocks.push({
				type: "section",
				text: { type: "mrkdwn", text: durationText },
			})
		}
	}

	if (richContext?.errorPattern?.lastErrorSnippet) {
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `❌ *Last error:*\n\`\`\`${richContext.errorPattern.lastErrorSnippet}\`\`\``,
			},
		})
	}

	if (
		richContext?.correlation?.relatedFailures &&
		richContext.correlation.relatedFailures.length > 0
	) {
		const related = richContext.correlation.relatedFailures
			.slice(0, 3)
			.map((f) => `• ${f.cronJobName}`)
			.join("\n")
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `🔗 *Related failures:*\n${related}`,
			},
		})
	}

	return blocks
}

async function send(ctx: AlertContext): Promise<SendResult> {
	const config = parseConfig<SlackWebhookConfig>(
		slackWebhookConfigSchema,
		ctx.channel.config,
		"SLACK_WEBHOOK",
	)
	const status = eventDisplayName(ctx.event)
	const emoji = isRecoveryEvent(ctx.event) ? ":white_check_mark:" : ":x:"
	const monitorName = getMonitorName(ctx)

	const blocks: Array<{
		type: string
		text: { type: string; text: string }
	}> = [
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `${emoji} *${monitorName}* is ${status}\nProject: ${ctx.project.name}`,
			},
		},
	]

	if (ctx.cronJob) {
		const contextBlocks = formatContextBlocks(ctx.richContext)
		blocks.push(...contextBlocks)
	}

	const message = {
		text: `${emoji} *${monitorName}* is ${status}`,
		blocks,
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
