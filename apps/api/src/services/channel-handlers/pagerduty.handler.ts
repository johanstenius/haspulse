import {
	type PagerDutyConfig,
	pagerdutyConfigSchema,
} from "../../routes/v1/channels/channels.schemas.js"
import {
	type AlertContext,
	type AlertPayload,
	type ChannelHandler,
	type HttpMonitorAlertPayload,
	type SendResult,
	buildHttpMonitorPayload,
	buildPayload,
	eventDisplayName,
	getErrorMessage,
	getMonitorName,
	isRecoveryEvent,
	parseConfig,
} from "./types.js"

async function send(ctx: AlertContext): Promise<SendResult> {
	const config = parseConfig<PagerDutyConfig>(
		pagerdutyConfigSchema,
		ctx.channel.config,
		"PAGERDUTY",
	)

	let payload: AlertPayload | HttpMonitorAlertPayload
	let monitorId: string
	if (ctx.cronJob) {
		payload = buildPayload(ctx.event, ctx.cronJob, ctx.project, ctx.richContext)
		monitorId = ctx.cronJob.id
	} else {
		payload = buildHttpMonitorPayload(ctx.event, ctx.httpMonitor, ctx.project)
		monitorId = ctx.httpMonitor.id
	}

	const monitorName = getMonitorName(ctx)

	const pdEvent = {
		routing_key: config.routingKey,
		event_action: isRecoveryEvent(ctx.event) ? "resolve" : "trigger",
		dedup_key: `haspulse-${monitorId}`,
		payload: {
			summary: `${monitorName} is ${eventDisplayName(ctx.event)}`,
			source: `haspulse/${ctx.project.slug}`,
			severity: isRecoveryEvent(ctx.event) ? "info" : "critical",
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
