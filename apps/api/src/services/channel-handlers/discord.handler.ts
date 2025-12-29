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
	const color = ctx.event === "cronJob.up" ? 0x00ff00 : 0xff0000

	const fields: Array<{ name: string; value: string; inline?: boolean }> = [
		{ name: "Project", value: ctx.project.name, inline: true },
		{ name: "Status", value: status, inline: true },
	]

	const lastDurationMs = ctx.richContext?.duration?.lastDurationMs
	if (lastDurationMs !== null && lastDurationMs !== undefined) {
		const d = ctx.richContext?.duration
		const durationSec = Math.round(lastDurationMs / 1000)
		let durationValue = `${durationSec}s`
		if (d?.avgDurationMs) {
			const avgSec = Math.round(d.avgDurationMs / 1000)
			const diff = Math.round(
				((lastDurationMs - d.avgDurationMs) / d.avgDurationMs) * 100,
			)
			const trend = diff > 0 ? `+${diff}%` : `${diff}%`
			durationValue += ` (avg: ${avgSec}s, ${trend})`
		}
		if (d?.isAnomaly) {
			durationValue += " ⚠️"
		}
		fields.push({ name: "Duration", value: durationValue, inline: true })
	}

	if (ctx.richContext?.errorPattern?.lastErrorSnippet) {
		const snippet = ctx.richContext.errorPattern.lastErrorSnippet.slice(0, 100)
		fields.push({ name: "Last Error", value: `\`\`\`${snippet}\`\`\`` })
	}

	if (
		ctx.richContext?.correlation?.relatedFailures &&
		ctx.richContext.correlation.relatedFailures.length > 0
	) {
		const related = ctx.richContext.correlation.relatedFailures
			.slice(0, 3)
			.map((f) => f.cronJobName)
			.join(", ")
		fields.push({ name: "Related Failures", value: related, inline: true })
	}

	const embed = {
		title: `${ctx.cronJob.name} is ${status}`,
		color,
		fields,
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
