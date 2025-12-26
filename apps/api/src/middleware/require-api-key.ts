import type { Context, Next } from "hono"
import { unauthorized } from "../lib/errors.js"
import { validateApiKey } from "../services/api-key.service.js"
import type { AuthEnv } from "./auth.js"

export async function requireApiKey(c: Context<AuthEnv>, next: Next) {
	const header = c.req.header("Authorization")
	if (!header?.startsWith("Bearer hp_")) {
		throw unauthorized("API key required")
	}

	const key = header.slice(7)
	const apiKey = await validateApiKey(key)
	if (!apiKey) {
		throw unauthorized("Invalid API key")
	}

	c.set("projectId", apiKey.projectId)
	c.set("authMethod", "api-key")
	await next()
}
