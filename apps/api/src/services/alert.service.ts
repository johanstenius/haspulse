import { logger } from "../lib/logger.js"
import {
	type AlertFilters,
	type AlertModel,
	type AlertModelWithCheck,
	type AlertOrgFilters,
	alertRepository,
} from "../repositories/alert.repository.js"
import { createPaginatedResult } from "../routes/v1/shared/schemas.js"
import { buildAlertContext } from "./alert-context.service.js"
import { type AlertEvent, sendToChannel } from "./channel-sender.service.js"
import { listChannelsByCheck } from "./channel.service.js"
import type { CheckModel } from "./check.service.js"
import { getProjectById } from "./project.service.js"

export type { AlertModel, AlertModelWithCheck }

export type AlertResult = {
	sent: boolean
	success: boolean
	skipped?: boolean
}

// Dedup cooldown in minutes per event type
const ALERT_COOLDOWN_MINUTES: Record<string, number> = {
	"check.fail": 5, // Don't spam on repeated failures
	"check.down": 0, // Always alert on down
	"check.up": 0, // Always alert on recovery
	"check.still_down": 0, // Handled by reminderIntervalHours
}

export async function triggerAlert(
	event: AlertEvent,
	check: CheckModel,
	options: { skipDedup?: boolean } = {},
): Promise<AlertResult> {
	const cooldown = ALERT_COOLDOWN_MINUTES[event] ?? 0
	if (!options.skipDedup && cooldown > 0) {
		const hasRecent = await alertRepository.hasRecentAlert(
			check.id,
			event,
			cooldown,
		)
		if (hasRecent) {
			logger.info(
				{ checkId: check.id, event, cooldown },
				"Alert skipped (dedup cooldown)",
			)
			return { sent: false, success: false, skipped: true }
		}
	}

	const channels = await listChannelsByCheck(check.id)
	if (channels.length === 0) {
		return { sent: false, success: false }
	}

	const project = await getProjectById(check.projectId)
	if (!project) {
		logger.error({ projectId: check.projectId }, "Project not found for alert")
		return { sent: false, success: false }
	}

	const context = await buildAlertContext(check, event)

	const results = await Promise.allSettled(
		channels.map((channel) =>
			sendToChannel(channel, event, check, project, context),
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
		checkId: check.id,
		event,
		channels: channelSnapshots,
		context,
		success: allSuccess,
		error: errors.length > 0 ? errors.join("; ") : null,
	})

	return { sent: true, success: allSuccess }
}

export async function getCheckAlertsPaginated(
	checkId: string,
	page: number,
	limit: number,
	filters?: AlertFilters,
) {
	const result = await alertRepository.findByCheckIdPaginated(
		checkId,
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
