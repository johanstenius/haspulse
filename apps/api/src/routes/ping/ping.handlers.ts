import type { PingType } from "@haspulse/db"
import type { Context } from "hono"
import { logger } from "../../lib/logger.js"
import { recordPing, resolveCheckId } from "../../services/ping.service.js"
import type { PingResponse } from "./ping.schemas.js"

function getClientIp(c: Context): string {
	return (
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
		c.req.header("x-real-ip") ||
		"unknown"
	)
}

function signalToPingType(signal?: string): PingType {
	switch (signal) {
		case "start":
			return "START"
		case "fail":
			return "FAIL"
		default:
			return "SUCCESS"
	}
}

async function getRequestBody(c: Context): Promise<string | null> {
	try {
		const text = await c.req.text()
		if (!text) return null
		const maxSize = 100 * 1024
		return text.length > maxSize ? text.slice(0, maxSize) : text
	} catch {
		return null
	}
}

export async function processPingById(
	c: Context,
	id: string,
	signal?: string,
): Promise<PingResponse> {
	const checkId = await resolveCheckId({ id })

	if (!checkId) {
		logger.warn({ id }, "Ping to unknown check ID")
		return { ok: true }
	}

	const body = await getRequestBody(c)
	const sourceIp = getClientIp(c)
	const type = signalToPingType(signal)

	await recordPing({ checkId, type, body, sourceIp })

	return { ok: true }
}

export async function processPingBySlug(
	c: Context,
	projectSlug: string,
	checkSlug: string,
	signal?: string,
): Promise<PingResponse> {
	const checkId = await resolveCheckId({ projectSlug, checkSlug })

	if (!checkId) {
		logger.warn({ projectSlug, checkSlug }, "Ping to unknown check")
		return { ok: true }
	}

	const body = await getRequestBody(c)
	const sourceIp = getClientIp(c)
	const type = signalToPingType(signal)

	await recordPing({ checkId, type, body, sourceIp })

	return { ok: true }
}
