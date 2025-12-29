import {
	type WebhookConfig,
	webhookConfigSchema,
} from "../../routes/v1/channels/channels.schemas.js"
import {
	type AlertContext,
	type ChannelHandler,
	type SendResult,
	buildPayload,
	getErrorMessage,
	parseConfig,
} from "./types.js"

async function send(ctx: AlertContext): Promise<SendResult> {
	const config = parseConfig<WebhookConfig>(
		webhookConfigSchema,
		ctx.channel.config,
		"WEBHOOK",
	)
	const payload = buildPayload(
		ctx.event,
		ctx.cronJob,
		ctx.project,
		ctx.richContext,
	)

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	}
	if (config.secret) {
		headers["X-Webhook-Secret"] = config.secret
	}

	const delays = [1000, 5000, 30000]
	let lastError = ""

	for (let attempt = 0; attempt <= delays.length; attempt++) {
		if (attempt > 0) {
			await new Promise((r) => setTimeout(r, delays[attempt - 1]))
		}

		try {
			const response = await fetch(config.url, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			})

			if (response.ok || response.status < 500) {
				if (!response.ok) {
					return {
						success: false,
						error: `Webhook returned ${response.status}`,
					}
				}
				return { success: true }
			}
			lastError = `Webhook returned ${response.status}`
		} catch (err) {
			lastError = getErrorMessage(err)
		}
	}

	return { success: false, error: lastError }
}

export const webhookHandler: ChannelHandler = { send }
