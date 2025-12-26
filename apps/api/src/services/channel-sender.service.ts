import type { AlertContext } from "./alert-context.service.js"
import {
	type AlertEvent,
	type SendResult,
	getHandler,
} from "./channel-handlers/index.js"
import type { ChannelModel } from "./channel.service.js"
import type { CheckModel } from "./check.service.js"
import type { ProjectModel } from "./project.service.js"

export type {
	AlertEvent,
	AlertPayload,
	SendResult,
} from "./channel-handlers/index.js"

export async function sendToChannel(
	channel: ChannelModel,
	event: AlertEvent,
	check: CheckModel,
	project: ProjectModel,
	richContext?: AlertContext,
): Promise<SendResult> {
	const handler = getHandler(channel.type)
	if (!handler) {
		return { success: false, error: `Unknown channel type: ${channel.type}` }
	}
	return handler.send({ channel, event, check, project, richContext })
}

export async function testChannel(
	channel: ChannelModel,
	project: ProjectModel,
): Promise<SendResult> {
	const testCheck: CheckModel = {
		id: "test-check-id",
		projectId: project.id,
		name: "Test Check",
		slug: "test-check",
		scheduleType: "PERIOD",
		scheduleValue: "86400",
		graceSeconds: 300,
		status: "DOWN",
		lastPingAt: new Date(),
		lastStartedAt: null,
		nextExpectedAt: null,
		lastAlertAt: null,
		alertOnRecovery: true,
		reminderIntervalHours: null,
		anomalySensitivity: "NORMAL",
		createdAt: new Date(),
		updatedAt: new Date(),
	}

	return sendToChannel(channel, "check.down", testCheck, project)
}
