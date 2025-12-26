import type { AlertContext as RichAlertContext } from "../alert-context.service.js"
import type { ChannelModel } from "../channel.service.js"
import type { CheckModel } from "../check.service.js"
import type { ProjectModel } from "../project.service.js"

export type AlertEvent = "check.down" | "check.up" | "check.still_down"

export type AlertPayloadContext = {
	duration?: {
		lastDurationMs: number | null
		last5Durations: number[]
		avgDurationMs: number | null
		trendDirection: "increasing" | "decreasing" | "stable" | "unknown"
		isAnomaly: boolean
		anomalyType?: "zscore" | "drift"
		zScore?: number
	}
	errorPattern?: {
		lastErrorSnippet: string | null
		errorCount24h: number
	}
	correlation?: {
		relatedFailures: Array<{
			checkId: string
			checkName: string
			failedAt: string
		}>
	}
}

export type AlertPayload = {
	event: AlertEvent
	check: {
		id: string
		slug: string | null
		name: string
		status: string
		lastPingAt: string | null
	}
	project: {
		slug: string
		name: string
	}
	timestamp: string
	context?: AlertPayloadContext
}

export type SendResult = {
	success: boolean
	error?: string
}

export type AlertContext = {
	channel: ChannelModel
	event: AlertEvent
	check: CheckModel
	project: ProjectModel
	richContext?: RichAlertContext
}

export type ChannelHandler = {
	send: (ctx: AlertContext) => Promise<SendResult>
}

export type { RichAlertContext }

export function parseConfig<T>(
	schema: {
		safeParse: (data: unknown) => {
			success: boolean
			data?: T
			error?: { message: string }
		}
	},
	config: unknown,
	channelType: string,
): T {
	const result = schema.safeParse(config)
	if (!result.success) {
		throw new Error(`Invalid ${channelType} config: ${result.error?.message}`)
	}
	return result.data as T
}

export function getErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message
	return String(err)
}

export function buildPayload(
	event: AlertEvent,
	check: CheckModel,
	project: ProjectModel,
	richContext?: RichAlertContext,
): AlertPayload {
	const payload: AlertPayload = {
		event,
		check: {
			id: check.id,
			slug: check.slug,
			name: check.name,
			status: check.status.toLowerCase(),
			lastPingAt: check.lastPingAt?.toISOString() ?? null,
		},
		project: {
			slug: project.slug,
			name: project.name,
		},
		timestamp: new Date().toISOString(),
	}

	if (richContext) {
		payload.context = richContext
	}

	return payload
}

export function eventDisplayName(event: AlertEvent): string {
	switch (event) {
		case "check.down":
			return "DOWN"
		case "check.up":
			return "RECOVERED"
		case "check.still_down":
			return "STILL DOWN"
	}
}
