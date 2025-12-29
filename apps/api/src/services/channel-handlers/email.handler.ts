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
	parseConfig,
} from "./types.js"

async function send(ctx: AlertContext): Promise<SendResult> {
	const config = parseConfig<EmailConfig>(
		emailConfigSchema,
		ctx.channel.config,
		"EMAIL",
	)
	const status = eventDisplayName(ctx.event)
	const emoji = ctx.event === "cronJob.up" ? "\u{2705}" : "\u{1F534}"

	const subject = `${emoji} ${ctx.cronJob.name} is ${status}`
	const html = await renderAlertEmail({
		cronJobName: ctx.cronJob.name,
		projectName: ctx.project.name,
		status: status as "DOWN" | "RECOVERED" | "STILL DOWN" | "FAILED",
		lastPingAt: ctx.cronJob.lastPingAt?.toISOString() ?? null,
		context: ctx.richContext,
	})

	return sendAlertEmail({
		to: config.email,
		subject,
		html,
	})
}

export const emailHandler: ChannelHandler = { send }
