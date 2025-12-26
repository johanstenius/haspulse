import { SendPigeon } from "sendpigeon"
import { config } from "../env.js"
import { logger } from "./logger.js"

type SendEmailParams = {
	to: string
	subject: string
	html: string
	text?: string
}

type SendResult = {
	success: boolean
	messageId?: string
	error?: string
}

const client = config.sendpigeonApiKey
	? new SendPigeon(config.sendpigeonApiKey)
	: null

async function send(
	from: string,
	params: SendEmailParams,
): Promise<SendResult> {
	if (!client) {
		logger.debug(
			{ to: params.to, subject: params.subject },
			"SendPigeon not configured",
		)
		return { success: true }
	}

	const result = await client.send({
		from,
		to: params.to,
		subject: params.subject,
		html: params.html,
		text: params.text,
	})

	if (result.error) {
		logger.error({ error: result.error.message }, "SendPigeon error")
		return { success: false, error: result.error.message }
	}

	return { success: true, messageId: result.data.id }
}

export function sendAlertEmail(params: SendEmailParams): Promise<SendResult> {
	return send(config.sendpigeonFromAlerts, params)
}

export function sendTransactionalEmail(
	params: SendEmailParams,
): Promise<SendResult> {
	return send(config.sendpigeonFromNoreply, params)
}
