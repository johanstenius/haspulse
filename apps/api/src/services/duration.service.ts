import type { AnomalySensitivity } from "@haspulse/db"
import {
	type DurationStatModel,
	durationStatRepository,
} from "../repositories/duration-stat.repository.js"
import { pingRepository } from "../repositories/ping.repository.js"

export type DurationTrend = {
	last5Durations: number[]
	avgDurationMs: number | null
	trendDirection: "increasing" | "decreasing" | "stable" | "unknown"
	percentileRank: number | null
	isAnomaly: boolean
	anomalyDetails: AnomalyDetails | null
}

export type AnomalyDetails = {
	type: "zscore" | "drift"
	currentValue: number
	threshold: number
	expectedRange: { min: number; max: number }
	severity: "warning" | "critical"
	zScore?: number
}

const SENSITIVITY_THRESHOLDS: Record<AnomalySensitivity, number> = {
	LOW: 3.5,
	NORMAL: 3.0,
	HIGH: 2.5,
}

const MIN_SAMPLES_FOR_ZSCORE = 10
const DRIFT_THRESHOLD_PERCENT = 30

function calculatePercentile(
	sortedValues: number[],
	percentile: number,
): number {
	if (sortedValues.length === 0) return 0
	const index = (percentile / 100) * (sortedValues.length - 1)
	const lower = Math.floor(index)
	const upper = Math.ceil(index)
	const lowerVal = sortedValues[lower] ?? 0
	const upperVal = sortedValues[upper] ?? lowerVal
	if (lower === upper) return lowerVal
	return lowerVal * (upper - index) + upperVal * (index - lower)
}

function calculateStdDev(values: number[], mean: number): number {
	if (values.length < 2) return 0
	const squaredDiffs = values.map((v) => (v - mean) ** 2)
	const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1)
	return Math.sqrt(variance)
}

function calculateZScore(value: number, mean: number, stdDev: number): number {
	if (stdDev === 0) return 0
	return (value - mean) / stdDev
}

function detectTrendDirection(
	durations: number[],
): "increasing" | "decreasing" | "stable" | "unknown" {
	if (durations.length < 3) return "unknown"

	let increases = 0
	let decreases = 0

	for (let i = 1; i < durations.length; i++) {
		const current = durations[i]
		const previous = durations[i - 1]
		if (current === undefined || previous === undefined || previous === 0)
			continue

		const diff = current - previous
		const percentChange = Math.abs(diff) / previous

		if (percentChange < 0.1) continue

		if (diff > 0) increases++
		else decreases++
	}

	const total = increases + decreases
	if (total < 2) return "stable"
	if (increases > decreases * 2) return "increasing"
	if (decreases > increases * 2) return "decreasing"
	return "stable"
}

export async function calculateDurationFromStart(
	checkId: string,
	endTimestamp: Date,
): Promise<{ durationMs: number; startPingId: string } | null> {
	const startPing = await pingRepository.findLatestStartPing(checkId)
	if (!startPing) return null

	if (startPing.createdAt >= endTimestamp) return null

	const durationMs = endTimestamp.getTime() - startPing.createdAt.getTime()
	return { durationMs, startPingId: startPing.id }
}

export async function updateRollingStats(
	checkId: string,
	_durationMs: number,
): Promise<void> {
	const now = new Date()
	const windowStart = new Date(now)
	windowStart.setDate(windowStart.getDate() - 7)
	windowStart.setHours(0, 0, 0, 0)

	const durations = await pingRepository.findAllDurationsInWindow(
		checkId,
		windowStart,
		now,
	)

	if (durations.length === 0) return

	const sorted = [...durations].sort((a, b) => a - b)
	const sum = durations.reduce((a, b) => a + b, 0)
	const avg = sum / durations.length

	await durationStatRepository.upsert(checkId, {
		windowStart,
		windowEnd: now,
		sampleCount: durations.length,
		avgDurationMs: avg,
		p50DurationMs: Math.round(calculatePercentile(sorted, 50)),
		p95DurationMs: Math.round(calculatePercentile(sorted, 95)),
		p99DurationMs: Math.round(calculatePercentile(sorted, 99)),
		stdDevMs: calculateStdDev(durations, avg),
		minDurationMs: sorted[0] ?? null,
		maxDurationMs: sorted[sorted.length - 1] ?? null,
	})
}

export async function getDurationTrend(
	checkId: string,
): Promise<DurationTrend> {
	const recentPings = await pingRepository.findRecentWithDuration(checkId, 5)
	const last5Durations = recentPings
		.map((p) => p.durationMs)
		.filter((d): d is number => d !== null)
		.reverse()

	const stats = await durationStatRepository.findLatestByCheckId(checkId)

	if (!stats || last5Durations.length === 0) {
		return {
			last5Durations,
			avgDurationMs: null,
			trendDirection: "unknown",
			percentileRank: null,
			isAnomaly: false,
			anomalyDetails: null,
		}
	}

	const currentDuration = last5Durations[last5Durations.length - 1]
	const trendDirection = detectTrendDirection(last5Durations)

	let percentileRank: number | null = null
	if (
		currentDuration !== undefined &&
		stats.p50DurationMs &&
		stats.p95DurationMs
	) {
		if (currentDuration <= stats.p50DurationMs) {
			percentileRank = 50
		} else if (currentDuration <= stats.p95DurationMs) {
			percentileRank = 95
		} else if (stats.p99DurationMs && currentDuration <= stats.p99DurationMs) {
			percentileRank = 99
		} else {
			percentileRank = 100
		}
	}

	return {
		last5Durations,
		avgDurationMs: stats.avgDurationMs,
		trendDirection,
		percentileRank,
		isAnomaly: false,
		anomalyDetails: null,
	}
}

export function detectAnomaly(
	currentDurationMs: number,
	stats: DurationStatModel,
	sensitivity: AnomalySensitivity,
): AnomalyDetails | null {
	if (stats.sampleCount < MIN_SAMPLES_FOR_ZSCORE) {
		return null
	}

	if (!stats.avgDurationMs || !stats.stdDevMs) {
		return null
	}

	const threshold = SENSITIVITY_THRESHOLDS[sensitivity]
	const zScore = calculateZScore(
		currentDurationMs,
		stats.avgDurationMs,
		stats.stdDevMs,
	)

	const absZScore = Math.abs(zScore)

	if (absZScore >= threshold) {
		const minExpected = Math.max(
			0,
			stats.avgDurationMs - threshold * stats.stdDevMs,
		)
		const maxExpected = stats.avgDurationMs + threshold * stats.stdDevMs

		return {
			type: "zscore",
			currentValue: currentDurationMs,
			threshold,
			expectedRange: {
				min: Math.round(minExpected),
				max: Math.round(maxExpected),
			},
			severity: absZScore >= threshold + 1 ? "critical" : "warning",
			zScore: Math.round(zScore * 100) / 100,
		}
	}

	if (stats.p50DurationMs) {
		const driftPercent =
			((currentDurationMs - stats.p50DurationMs) / stats.p50DurationMs) * 100

		if (driftPercent >= DRIFT_THRESHOLD_PERCENT) {
			return {
				type: "drift",
				currentValue: currentDurationMs,
				threshold: DRIFT_THRESHOLD_PERCENT,
				expectedRange: {
					min: stats.minDurationMs ?? 0,
					max: Math.round(stats.p50DurationMs * 1.3),
				},
				severity: driftPercent >= 50 ? "critical" : "warning",
			}
		}
	}

	return null
}

export async function getDurationStats(
	checkId: string,
): Promise<DurationStatModel | null> {
	return durationStatRepository.findLatestByCheckId(checkId)
}
