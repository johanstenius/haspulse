import type { AlertContext } from "./alert-context.service.js"
import {
	type AlertEvent,
	type SendResult,
	getHandler,
} from "./channel-handlers/index.js"
import type { ChannelModel } from "./channel.service.js"
import type { CronJobModel } from "./cron-job.service.js"
import type { HttpMonitorModel } from "./http-monitor.service.js"
import type { ProjectModel } from "./project.service.js"

export type {
	AlertEvent,
	AlertPayload,
	SendResult,
} from "./channel-handlers/index.js"

export async function sendToChannel(
	channel: ChannelModel,
	event: AlertEvent,
	cronJob: CronJobModel,
	project: ProjectModel,
	richContext?: AlertContext,
): Promise<SendResult> {
	const handler = getHandler(channel.type)
	if (!handler) {
		return { success: false, error: `Unknown channel type: ${channel.type}` }
	}
	return handler.send({ channel, event, cronJob, project, richContext })
}

export async function sendToChannelForHttpMonitor(
	channel: ChannelModel,
	event: AlertEvent,
	httpMonitor: HttpMonitorModel,
	project: ProjectModel,
): Promise<SendResult> {
	const handler = getHandler(channel.type)
	if (!handler) {
		return { success: false, error: `Unknown channel type: ${channel.type}` }
	}
	return handler.send({ channel, event, httpMonitor, project })
}

export async function testChannel(
	channel: ChannelModel,
	project: ProjectModel,
): Promise<SendResult> {
	const testCronJob: CronJobModel = {
		id: "test-cron-job-id",
		projectId: project.id,
		name: "Test Cron Job",
		slug: "test-cron-job",
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

	return sendToChannel(channel, "cronJob.down", testCronJob, project)
}
