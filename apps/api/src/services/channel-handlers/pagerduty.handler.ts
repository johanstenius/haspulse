import {
	type PagerDutyConfig,
	pagerdutyConfigSchema,
} from "../../routes/v1/channels/channels.schemas.js"
import {
	type AlertContext,
	type ChannelHandler,
	type SendResult,
	buildPayload,
	eventDisplayName,
	getErrorMessage,
	parseConfig,
} from "./types.js"

async function send(ctx: AlertContext): Promise<SendResult> {
	const config = parseConfig<PagerDutyConfig>(
		pagerdutyConfigSchema,
		ctx.channel.config,
		"PAGERDUTY",
	)
	const payload = buildPayload(
		ctx.event,
		ctx.cronJob,
		ctx.project,
		ctx.richContext,
	)

	const pdEvent = {
		routing_key: config.routingKey,
		event_action: ctx.event === "cronJob.up" ? "resolve" : "trigger",
		dedup_key: `haspulse-${ctx.cronJob.id}`,
		payload: {
			summary: `${ctx.cronJob.name} is ${eventDisplayName(ctx.event)}`,
			source: `haspulse/${ctx.project.slug}`,
			severity: ctx.event === "cronJob.up" ? "info" : "critical",
			timestamp: payload.timestamp,
			custom_details: payload,
		},
	}

	try {
		const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(pdEvent),
		})
		if (!response.ok) {
			const body = await response.text()
			return { success: false, error: `PagerDuty: ${response.status} ${body}` }
		}
		return { success: true }
	} catch (err) {
		return { success: false, error: getErrorMessage(err) }
	}
}

export const pagerdutyHandler: ChannelHandler = { send }
