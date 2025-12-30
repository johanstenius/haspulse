import { logger } from "../lib/logger.js"
import {
	type AlertFilters,
	type AlertModel,
	type AlertModelWithCronJob,
	type AlertOrgFilters,
	alertRepository,
} from "../repositories/alert.repository.js"
import {
	type HttpMonitorAlertFilters,
	type HttpMonitorAlertModel,
	httpMonitorAlertRepository,
} from "../repositories/http-monitor-alert.repository.js"
import { createPaginatedResult } from "../routes/v1/shared/schemas.js"
import { buildAlertContext } from "./alert-context.service.js"
import {
	type AlertEvent,
	sendToChannel,
	sendToChannelForHttpMonitor,
} from "./channel-sender.service.js"
import {
	listChannelsByCronJob,
	listChannelsByHttpMonitor,
} from "./channel.service.js"
import type { CronJobModel } from "./cron-job.service.js"
import type { HttpMonitorModel } from "./http-monitor.service.js"
import { getProjectById } from "./project.service.js"

export type { AlertModel, AlertModelWithCronJob, HttpMonitorAlertModel }

export type AlertResult = {
	sent: boolean
	success: boolean
	skipped?: boolean
}

// Dedup cooldown in minutes per event type
const ALERT_COOLDOWN_MINUTES: Record<string, number> = {
	"cronJob.fail": 5, // Don't spam on repeated failures
	"cronJob.down": 0, // Always alert on down
	"cronJob.up": 0, // Always alert on recovery
	"cronJob.still_down": 0, // Handled by reminderIntervalHours
}

export async function triggerAlert(
	event: AlertEvent,
	cronJob: CronJobModel,
	options: { skipDedup?: boolean } = {},
): Promise<AlertResult> {
	const cooldown = ALERT_COOLDOWN_MINUTES[event] ?? 0
	if (!options.skipDedup && cooldown > 0) {
		const hasRecent = await alertRepository.hasRecentAlert(
			cronJob.id,
			event,
			cooldown,
		)
		if (hasRecent) {
			logger.info(
				{ cronJobId: cronJob.id, event, cooldown },
				"Alert skipped (dedup cooldown)",
			)
			return { sent: false, success: false, skipped: true }
		}
	}

	const channels = await listChannelsByCronJob(cronJob.id)
	if (channels.length === 0) {
		return { sent: false, success: false }
	}

	const project = await getProjectById(cronJob.projectId)
	if (!project) {
		logger.error(
			{ projectId: cronJob.projectId },
			"Project not found for alert",
		)
		return { sent: false, success: false }
	}

	const context = await buildAlertContext(cronJob, event)

	const results = await Promise.allSettled(
		channels.map((channel) =>
			sendToChannel(channel, event, cronJob, project, context),
		),
	)

	const channelSnapshots = channels.map((c) => ({
		id: c.id,
		name: c.name,
		type: c.type,
	}))

	let allSuccess = true
	const errors: string[] = []

	for (let i = 0; i < results.length; i++) {
		const result = results[i]
		const channel = channels[i]
		if (!result || !channel) continue

		if (result.status === "rejected") {
			allSuccess = false
			errors.push(`${channel.name}: ${String(result.reason)}`)
		} else if (!result.value.success) {
			allSuccess = false
			errors.push(`${channel.name}: ${result.value.error}`)
		}
	}

	await alertRepository.create({
		cronJobId: cronJob.id,
		event,
		channels: channelSnapshots,
		context,
		success: allSuccess,
		error: errors.length > 0 ? errors.join("; ") : null,
	})

	return { sent: true, success: allSuccess }
}

export async function getCronJobAlertsPaginated(
	cronJobId: string,
	page: number,
	limit: number,
	filters?: AlertFilters,
) {
	const result = await alertRepository.findByCronJobIdPaginated(
		cronJobId,
		page,
		limit,
		filters,
	)
	return createPaginatedResult(result.data, result.total, page, limit)
}

export async function getOrgAlertsPaginated(
	orgId: string,
	page: number,
	limit: number,
	filters?: AlertOrgFilters,
) {
	const result = await alertRepository.findByOrgIdPaginated(
		orgId,
		page,
		limit,
		filters,
	)
	return createPaginatedResult(result.data, result.total, page, limit)
}

// HTTP Monitor Alerts

export async function triggerHttpMonitorAlert(
	event: AlertEvent,
	httpMonitor: HttpMonitorModel,
): Promise<AlertResult> {
	const channels = await listChannelsByHttpMonitor(httpMonitor.id)
	if (channels.length === 0) {
		return { sent: false, success: false }
	}

	const project = await getProjectById(httpMonitor.projectId)
	if (!project) {
		logger.error(
			{ projectId: httpMonitor.projectId },
			"Project not found for HTTP monitor alert",
		)
		return { sent: false, success: false }
	}

	const results = await Promise.allSettled(
		channels.map((channel) =>
			sendToChannelForHttpMonitor(channel, event, httpMonitor, project),
		),
	)

	const channelSnapshots = channels.map((c) => ({
		id: c.id,
		name: c.name,
		type: c.type,
	}))

	let allSuccess = true
	const errors: string[] = []

	for (let i = 0; i < results.length; i++) {
		const result = results[i]
		const channel = channels[i]
		if (!result || !channel) continue

		if (result.status === "rejected") {
			allSuccess = false
			errors.push(`${channel.name}: ${String(result.reason)}`)
		} else if (!result.value.success) {
			allSuccess = false
			errors.push(`${channel.name}: ${result.value.error}`)
		}
	}

	await httpMonitorAlertRepository.create({
		httpMonitorId: httpMonitor.id,
		event,
		channels: channelSnapshots,
		success: allSuccess,
		error: errors.length > 0 ? errors.join("; ") : null,
	})

	return { sent: true, success: allSuccess }
}

export async function getHttpMonitorAlertsPaginated(
	httpMonitorId: string,
	page: number,
	limit: number,
	filters?: HttpMonitorAlertFilters,
) {
	const result = await httpMonitorAlertRepository.findByHttpMonitorIdPaginated(
		httpMonitorId,
		page,
		limit,
		filters,
	)
	return createPaginatedResult(result.data, result.total, page, limit)
}
