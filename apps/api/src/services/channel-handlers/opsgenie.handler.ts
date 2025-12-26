import {
	type OpsgenieConfig,
	opsgenieConfigSchema,
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
	const config = parseConfig<OpsgenieConfig>(
		opsgenieConfigSchema,
		ctx.channel.config,
		"OPSGENIE",
	)
	const baseUrl =
		config.region === "eu"
			? "https://api.eu.opsgenie.com"
			: "https://api.opsgenie.com"

	const alias = `haspulse-${ctx.check.id}`

	if (ctx.event === "check.up") {
		try {
			const response = await fetch(
				`${baseUrl}/v2/alerts/${alias}/close?identifierType=alias`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `GenieKey ${config.apiKey}`,
					},
					body: JSON.stringify({ note: "Check recovered" }),
				},
			)
			return response.ok
				? { success: true }
				: { success: false, error: `Opsgenie: ${response.status}` }
		} catch (err) {
			return { success: false, error: getErrorMessage(err) }
		}
	}

	const details: Record<string, string> = {
		checkId: ctx.check.id,
		projectSlug: ctx.project.slug,
		event: ctx.event,
	}

	if (
		ctx.richContext?.duration?.lastDurationMs !== null &&
		ctx.richContext?.duration?.lastDurationMs !== undefined
	) {
		details.durationMs = String(ctx.richContext.duration.lastDurationMs)
		if (ctx.richContext.duration.avgDurationMs) {
			details.avgDurationMs = String(
				Math.round(ctx.richContext.duration.avgDurationMs),
			)
		}
		if (ctx.richContext.duration.isAnomaly) {
			details.isAnomaly = "true"
		}
	}

	if (ctx.richContext?.errorPattern?.lastErrorSnippet) {
		details.lastError = ctx.richContext.errorPattern.lastErrorSnippet.slice(
			0,
			500,
		)
	}

	if (
		ctx.richContext?.correlation?.relatedFailures &&
		ctx.richContext.correlation.relatedFailures.length > 0
	) {
		details.relatedFailures = ctx.richContext.correlation.relatedFailures
			.slice(0, 5)
			.map((f) => f.checkName)
			.join(", ")
	}

	const alert = {
		message: `${ctx.check.name} is ${eventDisplayName(ctx.event)}`,
		alias,
		priority: "P1",
		source: "Haspulse",
		tags: ["haspulse", ctx.project.slug],
		details,
	}

	try {
		const response = await fetch(`${baseUrl}/v2/alerts`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `GenieKey ${config.apiKey}`,
			},
			body: JSON.stringify(alert),
		})
		return response.ok
			? { success: true }
			: { success: false, error: `Opsgenie: ${response.status}` }
	} catch (err) {
		return { success: false, error: getErrorMessage(err) }
	}
}

export const opsgenieHandler: ChannelHandler = { send }
