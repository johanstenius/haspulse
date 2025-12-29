import type { PingType } from "@haspulse/db"
import type { Context } from "hono"
import { logger } from "../../lib/logger.js"
import { cronJobRepository } from "../../repositories/cron-job.repository.js"
import { recordPing } from "../../services/ping.service.js"
import type { PingResponse } from "./ping.schemas.js"

function getClientIp(c: Context): string {
	return (
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
		c.req.header("x-real-ip") ||
		"unknown"
	)
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

export async function processPing(
	c: Context,
	projectId: string,
	slug: string,
	type: PingType,
): Promise<PingResponse> {
	const cronJobId = await cronJobRepository.findIdBySlugInProject(
		projectId,
		slug,
	)

	if (!cronJobId) {
		logger.warn({ projectId, slug }, "Ping to unknown cron job")
		return { ok: true }
	}

	const body = await getRequestBody(c)
	const sourceIp = getClientIp(c)

	await recordPing({ cronJobId, type, body, sourceIp })

	return { ok: true }
}
