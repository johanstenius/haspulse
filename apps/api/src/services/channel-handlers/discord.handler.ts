import {
	type DiscordConfig,
	discordConfigSchema,
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
	const config = parseConfig<DiscordConfig>(
		discordConfigSchema,
		ctx.channel.config,
		"DISCORD",
	)
	const status = eventDisplayName(ctx.event)
	const color = ctx.event === "check.up" ? 0x00ff00 : 0xff0000

	const embed = {
		title: `${ctx.check.name} is ${status}`,
		color,
		fields: [
			{ name: "Project", value: ctx.project.name, inline: true },
			{ name: "Status", value: status, inline: true },
		],
		timestamp: new Date().toISOString(),
	}

	try {
		const response = await fetch(config.webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ embeds: [embed] }),
		})
		if (!response.ok) {
			return { success: false, error: `Discord returned ${response.status}` }
		}
		return { success: true }
	} catch (err) {
		return { success: false, error: getErrorMessage(err) }
	}
}

export const discordHandler: ChannelHandler = { send }
