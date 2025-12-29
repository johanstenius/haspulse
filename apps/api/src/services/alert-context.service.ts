import { cronJobRepository } from "../repositories/cron-job.repository.js"
import { durationStatRepository } from "../repositories/duration-stat.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"
import type { AlertContext } from "../routes/v1/alerts/alerts.schemas.js"
import type { CronJobModel } from "./cron-job.service.js"
import {
	type AnomalyDetails,
	detectAnomaly,
	getDurationTrend,
} from "./duration.service.js"

export type { AlertContext }

const MAX_ERROR_SNIPPET_LENGTH = 200
const CORRELATION_WINDOW_MINUTES = 5
const MAX_RELATED_FAILURES = 10

async function buildDurationContext(
	cronJobId: string,
	sensitivity: CronJobModel["anomalySensitivity"],
): Promise<AlertContext["duration"] | undefined> {
	const trend = await getDurationTrend(cronJobId)

	if (trend.last5Durations.length === 0) {
		return undefined
	}

	const lastDurationMs =
		trend.last5Durations[trend.last5Durations.length - 1] ?? null

	let anomalyDetails: AnomalyDetails | null = null
	if (lastDurationMs !== null) {
		const stats = await durationStatRepository.findLatestByCronJobId(cronJobId)
		if (stats) {
			anomalyDetails = detectAnomaly(lastDurationMs, stats, sensitivity)
		}
	}

	return {
		lastDurationMs,
		last5Durations: trend.last5Durations,
		avgDurationMs: trend.avgDurationMs,
		trendDirection: trend.trendDirection,
		isAnomaly: anomalyDetails !== null,
		anomalyType: anomalyDetails?.type,
		zScore: anomalyDetails?.zScore,
	}
}

async function buildErrorContext(
	cronJobId: string,
): Promise<AlertContext["errorPattern"] | undefined> {
	const recentPings = await pingRepository.findByCronJobId(cronJobId, 10)
	const failedPings = recentPings.filter((p) => p.type === "FAIL")

	const lastErrorPing = failedPings[0]
	let lastErrorSnippet: string | null = null

	if (lastErrorPing?.body) {
		const body = lastErrorPing.body.trim()
		lastErrorSnippet =
			body.length > MAX_ERROR_SNIPPET_LENGTH
				? `${body.slice(0, MAX_ERROR_SNIPPET_LENGTH)}...`
				: body
	}

	const twentyFourHoursAgo = new Date()
	twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

	const errorCount24h = await pingRepository.countFailedByCronJobId(
		cronJobId,
		twentyFourHoursAgo,
	)

	if (!lastErrorSnippet && errorCount24h === 0) {
		return undefined
	}

	return {
		lastErrorSnippet,
		errorCount24h,
	}
}

async function buildCorrelationContext(
	cronJob: CronJobModel,
): Promise<AlertContext["correlation"] | undefined> {
	const now = new Date()
	const windowStart = new Date(
		now.getTime() - CORRELATION_WINDOW_MINUTES * 60 * 1000,
	)
	const windowEnd = new Date(
		now.getTime() + CORRELATION_WINDOW_MINUTES * 60 * 1000,
	)

	const allCronJobs = await cronJobRepository.findByProjectId(cronJob.projectId)
	const otherCronJobIds = allCronJobs
		.filter((c) => c.id !== cronJob.id)
		.map((c) => c.id)

	if (otherCronJobIds.length === 0) {
		return undefined
	}

	const failures = await pingRepository.findFailedInTimeWindow(
		otherCronJobIds,
		windowStart,
		windowEnd,
	)

	if (failures.length === 0) {
		return undefined
	}

	const uniqueFailures = new Map<
		string,
		{ cronJobId: string; cronJobName: string; failedAt: string }
	>()

	for (const failure of failures) {
		if (!uniqueFailures.has(failure.cronJobId)) {
			uniqueFailures.set(failure.cronJobId, {
				cronJobId: failure.cronJobId,
				cronJobName: failure.cronJobName,
				failedAt: failure.createdAt.toISOString(),
			})
		}
	}

	const relatedFailures = Array.from(uniqueFailures.values()).slice(
		0,
		MAX_RELATED_FAILURES,
	)

	return {
		relatedFailures,
	}
}

export async function buildAlertContext(
	cronJob: CronJobModel,
	_event: string,
): Promise<AlertContext> {
	const [duration, errorPattern, correlation] = await Promise.all([
		buildDurationContext(cronJob.id, cronJob.anomalySensitivity),
		buildErrorContext(cronJob.id),
		buildCorrelationContext(cronJob),
	])

	const context: AlertContext = {}

	if (duration) {
		context.duration = duration
	}

	if (errorPattern) {
		context.errorPattern = errorPattern
	}

	if (correlation) {
		context.correlation = correlation
	}

	return context
}
