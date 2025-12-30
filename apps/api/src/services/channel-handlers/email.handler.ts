import { renderAlertEmail } from "../../emails/index.js"
import { sendAlertEmail } from "../../lib/sendpigeon.js"
import {
	type EmailConfig,
	emailConfigSchema,
} from "../../routes/v1/channels/channels.schemas.js"
import {
	type AlertContext,
	type ChannelHandler,
	type SendResult,
	eventDisplayName,
	getMonitorName,
	isRecoveryEvent,
	parseConfig,
} from "./types.js"

async function send(ctx: AlertContext): Promise<SendResult> {
	const config = parseConfig<EmailConfig>(
		emailConfigSchema,
		ctx.channel.config,
		"EMAIL",
	)
	const status = eventDisplayName(ctx.event)
	const emoji = isRecoveryEvent(ctx.event) ? "\u{2705}" : "\u{1F534}"
	const monitorName = getMonitorName(ctx)

	const subject = `${emoji} ${monitorName} is ${status}`

	const lastPingAt = ctx.cronJob
		? (ctx.cronJob.lastPingAt?.toISOString() ?? null)
		: (ctx.httpMonitor.lastCheckedAt?.toISOString() ?? null)

	const html = await renderAlertEmail({
		cronJobName: monitorName,
		projectName: ctx.project.name,
		status: status as "DOWN" | "RECOVERED" | "STILL DOWN" | "FAILED",
		lastPingAt,
		context: ctx.cronJob ? ctx.richContext : undefined,
	})

	return sendAlertEmail({
		to: config.email,
		subject,
		html,
	})
}

export const emailHandler: ChannelHandler = { send }
