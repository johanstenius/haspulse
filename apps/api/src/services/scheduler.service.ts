import { MonitorStatus } from "@haspulse/db"
import { logger } from "../lib/logger.js"
import { cronJobRepository } from "../repositories/cron-job.repository.js"
import { httpMonitorRepository } from "../repositories/http-monitor.repository.js"
import { triggerAlert } from "./alert.service.js"
import { incidentService } from "./incident.service.js"
import { pruneAllPings } from "./pruning.service.js"
import {
	recordCronJobStatus,
	recordHttpMonitorStatus,
} from "./stats.service.js"

const SCHEDULER_INTERVAL_MS = 60_000
const PRUNE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
let lastPruneRun = 0

export function startScheduler(): void {
	logger.info({ intervalMs: SCHEDULER_INTERVAL_MS }, "Starting scheduler")
	setInterval(async () => {
		try {
			await runSchedulerTick()
		} catch (err) {
			logger.error({ err }, "Scheduler tick failed")
		}
	}, SCHEDULER_INTERVAL_MS)
	// Run immediately on startup
	runSchedulerTick().catch((err) => {
		logger.error({ err }, "Initial scheduler tick failed")
	})
}

export async function runSchedulerTick(): Promise<void> {
	const now = new Date()

	// Cron job status checks
	const lateCronJobs = await cronJobRepository.findLateCronJobs(now)
	for (const cronJob of lateCronJobs) {
		await cronJobRepository.updateStatus(cronJob.id, MonitorStatus.LATE)
	}

	const downCronJobs = await cronJobRepository.findDownCronJobs(now)
	for (const cronJob of downCronJobs) {
		await cronJobRepository.updateStatus(cronJob.id, MonitorStatus.DOWN)
		const updated = { ...cronJob, status: MonitorStatus.DOWN }

		try {
			const result = await triggerAlert("cronJob.down", updated)
			if (result.sent) {
				await cronJobRepository.updateLastAlertAt(cronJob.id, now)
			}
		} catch (err) {
			logger.error({ err, cronJobId: cronJob.id }, "Alert failed")
		}

		// Auto-incident for status page
		try {
			await incidentService.handleMonitorDown(
				cronJob.projectId,
				cronJob.name,
				cronJob.id,
				undefined,
			)
		} catch (err) {
			logger.error({ err, cronJobId: cronJob.id }, "Auto-incident failed")
		}
	}

	const stillDownCronJobs = await cronJobRepository.findStillDownCronJobs(now)
	for (const cronJob of stillDownCronJobs) {
		try {
			const result = await triggerAlert("cronJob.still_down", cronJob)
			if (result.sent) {
				await cronJobRepository.updateLastAlertAt(cronJob.id, now)
			}
		} catch (err) {
			logger.error({ err, cronJobId: cronJob.id }, "Reminder failed")
		}
	}

	// HTTP monitor polling
	await pollHttpMonitors(now)

	// Record uptime stats for all active monitors
	await recordUptimeStats()

	// Prune old pings hourly
	const nowMs = Date.now()
	if (nowMs - lastPruneRun > PRUNE_INTERVAL_MS) {
		try {
			const result = await pruneAllPings()
			logger.info(
				{
					pingsDeleted: result.pingsDeleted,
					cronJobsProcessed: result.cronJobsProcessed,
				},
				"Pruning complete",
			)
			lastPruneRun = nowMs
		} catch (err) {
			logger.error({ err }, "Pruning failed")
		}
	}
}

async function pollHttpMonitors(now: Date): Promise<void> {
	const dueMonitors = await httpMonitorRepository.findDueForPolling(now)

	for (const monitor of dueMonitors) {
		try {
			const result = await executeHttpCheck(monitor)
			const nextCheckAt = new Date(now.getTime() + monitor.interval * 1000)

			await httpMonitorRepository.recordPollResult({
				httpMonitorId: monitor.id,
				success: result.success,
				statusCode: result.statusCode,
				responseMs: result.responseMs,
				error: result.error,
			})

			const { wasDown } = await httpMonitorRepository.updateAfterPoll(
				monitor.id,
				{
					success: result.success,
					statusCode: result.statusCode,
					responseMs: result.responseMs,
					nextCheckAt,
				},
			)

			// Log status changes and handle auto-incidents
			if (!result.success) {
				logger.warn(
					{
						httpMonitorId: monitor.id,
						name: monitor.name,
						url: monitor.url,
						error: result.error,
						statusCode: result.statusCode,
					},
					"HTTP monitor check failed",
				)

				// Create auto-incident if this failure caused DOWN status
				// (wasDown being false means we just transitioned to DOWN)
				if (!wasDown) {
					try {
						await incidentService.handleMonitorDown(
							monitor.projectId,
							monitor.name,
							undefined,
							monitor.id,
						)
					} catch (err) {
						logger.error(
							{ err, httpMonitorId: monitor.id },
							"Auto-incident failed",
						)
					}
				}
			} else if (wasDown) {
				logger.info(
					{
						httpMonitorId: monitor.id,
						name: monitor.name,
						responseMs: result.responseMs,
					},
					"HTTP monitor recovered",
				)

				// Resolve auto-incident on recovery
				try {
					await incidentService.handleMonitorRecovered(
						monitor.projectId,
						monitor.name,
						undefined,
						monitor.id,
					)
				} catch (err) {
					logger.error(
						{ err, httpMonitorId: monitor.id },
						"Auto-incident resolve failed",
					)
				}
			}
		} catch (err) {
			logger.error({ err, httpMonitorId: monitor.id }, "HTTP poll failed")
		}
	}

	// Check for monitors that should transition to DOWN (LATE + grace period exceeded)
	const lateMonitors = await httpMonitorRepository.findLateMonitors(now)
	for (const monitor of lateMonitors) {
		await httpMonitorRepository.updateStatus(monitor.id, MonitorStatus.DOWN)
		logger.warn(
			{ httpMonitorId: monitor.id, name: monitor.name },
			"HTTP monitor marked DOWN",
		)
	}
}

type HttpCheckResult = {
	success: boolean
	statusCode?: number
	responseMs?: number
	error?: string
}

async function executeHttpCheck(monitor: {
	url: string
	method: string
	headers: Record<string, string> | null
	body: string | null
	timeout: number
	expectedStatus: number
	expectedBody: string | null
}): Promise<HttpCheckResult> {
	const start = Date.now()

	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(
			() => controller.abort(),
			monitor.timeout * 1000,
		)

		const response = await fetch(monitor.url, {
			method: monitor.method,
			headers: monitor.headers ?? undefined,
			body: monitor.body ?? undefined,
			signal: controller.signal,
		})

		clearTimeout(timeoutId)
		const responseMs = Date.now() - start

		// Check status code
		if (response.status !== monitor.expectedStatus) {
			return {
				success: false,
				statusCode: response.status,
				responseMs,
				error: `Expected status ${monitor.expectedStatus}, got ${response.status}`,
			}
		}

		// Check body if required
		if (monitor.expectedBody) {
			const body = await response.text()
			if (!body.includes(monitor.expectedBody)) {
				return {
					success: false,
					statusCode: response.status,
					responseMs,
					error: "Response body mismatch",
				}
			}
		}

		return {
			success: true,
			statusCode: response.status,
			responseMs,
		}
	} catch (err) {
		const responseMs = Date.now() - start
		const error =
			err instanceof Error
				? err.name === "AbortError"
					? `Timeout after ${monitor.timeout}s`
					: err.message
				: "Unknown error"

		return {
			success: false,
			responseMs,
			error,
		}
	}
}

async function recordUptimeStats(): Promise<void> {
	// Record cron job stats
	const activeCronJobs = await cronJobRepository.findActiveCronJobs()
	for (const cronJob of activeCronJobs) {
		try {
			await recordCronJobStatus(cronJob.id, cronJob.status)
		} catch (err) {
			logger.error({ err, cronJobId: cronJob.id }, "Stats recording failed")
		}
	}

	// Record HTTP monitor stats
	const activeHttpMonitors = await httpMonitorRepository.findDueForPolling(
		new Date(Date.now() + 24 * 60 * 60 * 1000), // Include all active monitors
	)
	for (const monitor of activeHttpMonitors) {
		try {
			await recordHttpMonitorStatus(monitor.id, monitor.status)
		} catch (err) {
			logger.error(
				{ err, httpMonitorId: monitor.id },
				"HTTP monitor stats recording failed",
			)
		}
	}
}
