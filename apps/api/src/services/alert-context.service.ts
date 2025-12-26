import { checkRepository } from "../repositories/check.repository.js"
import { durationStatRepository } from "../repositories/duration-stat.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"
import type { AlertContext } from "../routes/v1/alerts/alerts.schemas.js"
import type { CheckModel } from "./check.service.js"
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
	checkId: string,
	sensitivity: CheckModel["anomalySensitivity"],
): Promise<AlertContext["duration"] | undefined> {
	const trend = await getDurationTrend(checkId)

	if (trend.last5Durations.length === 0) {
		return undefined
	}

	const lastDurationMs =
		trend.last5Durations[trend.last5Durations.length - 1] ?? null

	let anomalyDetails: AnomalyDetails | null = null
	if (lastDurationMs !== null) {
		const stats = await durationStatRepository.findLatestByCheckId(checkId)
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
	checkId: string,
): Promise<AlertContext["errorPattern"] | undefined> {
	const recentPings = await pingRepository.findByCheckId(checkId, 10)
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

	const errorCount24h = await pingRepository.countFailedByCheckId(
		checkId,
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
	check: CheckModel,
): Promise<AlertContext["correlation"] | undefined> {
	const now = new Date()
	const windowStart = new Date(
		now.getTime() - CORRELATION_WINDOW_MINUTES * 60 * 1000,
	)
	const windowEnd = new Date(
		now.getTime() + CORRELATION_WINDOW_MINUTES * 60 * 1000,
	)

	const allChecks = await checkRepository.findByProjectId(check.projectId)
	const otherCheckIds = allChecks
		.filter((c) => c.id !== check.id)
		.map((c) => c.id)

	if (otherCheckIds.length === 0) {
		return undefined
	}

	const failures = await pingRepository.findFailedInTimeWindow(
		otherCheckIds,
		windowStart,
		windowEnd,
	)

	if (failures.length === 0) {
		return undefined
	}

	const uniqueFailures = new Map<
		string,
		{ checkId: string; checkName: string; failedAt: string }
	>()

	for (const failure of failures) {
		if (!uniqueFailures.has(failure.checkId)) {
			uniqueFailures.set(failure.checkId, {
				checkId: failure.checkId,
				checkName: failure.checkName,
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
	check: CheckModel,
	_event: string,
): Promise<AlertContext> {
	const [duration, errorPattern, correlation] = await Promise.all([
		buildDurationContext(check.id, check.anomalySensitivity),
		buildErrorContext(check.id),
		buildCorrelationContext(check),
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
