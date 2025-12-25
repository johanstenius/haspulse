import { alertRepository } from "../repositories/alert.repository.js"
import { type AlertEvent, sendToChannel } from "./channel-sender.service.js"
import { listChannelsByCheck } from "./channel.service.js"
import type { CheckModel } from "./check.service.js"
import { getProjectById } from "./project.service.js"

export type AlertResult = {
	sent: boolean
	success: boolean
}

export async function triggerAlert(
	event: AlertEvent,
	check: CheckModel,
): Promise<AlertResult> {
	const channels = await listChannelsByCheck(check.id)
	if (channels.length === 0) {
		return { sent: false, success: false }
	}

	const project = await getProjectById(check.projectId)
	if (!project) {
		console.error(`[alert] Project not found: ${check.projectId}`)
		return { sent: false, success: false }
	}

	const results = await Promise.allSettled(
		channels.map((channel) => sendToChannel(channel, event, check, project)),
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
		success: allSuccess,
		error: errors.length > 0 ? errors.join("; ") : null,
	})

	return { sent: true, success: allSuccess }
}
