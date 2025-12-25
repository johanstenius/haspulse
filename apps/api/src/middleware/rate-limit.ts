import type { Context, Next } from "hono"

type RateLimitEntry = {
	count: number
	resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // 10 requests per minute per check

// Cleanup old entries every 5 minutes
setInterval(
	() => {
		const now = Date.now()
		for (const [key, entry] of store) {
			if (entry.resetAt < now) {
				store.delete(key)
			}
		}
	},
	5 * 60 * 1000,
)

export function pingRateLimit(getCheckId: (c: Context) => string | null) {
	return async function rateLimitMiddleware(c: Context, next: Next) {
		const checkId = getCheckId(c)
		if (!checkId) {
			await next()
			return
		}

		const now = Date.now()
		const key = `ping:${checkId}`
		const entry = store.get(key)

		if (!entry || entry.resetAt < now) {
			store.set(key, { count: 1, resetAt: now + WINDOW_MS })
			c.header("X-RateLimit-Limit", String(MAX_REQUESTS))
			c.header("X-RateLimit-Remaining", String(MAX_REQUESTS - 1))
			c.header("X-RateLimit-Reset", String(Math.ceil((now + WINDOW_MS) / 1000)))
			await next()
			return
		}

		if (entry.count >= MAX_REQUESTS) {
			c.header("X-RateLimit-Limit", String(MAX_REQUESTS))
			c.header("X-RateLimit-Remaining", "0")
			c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)))
			c.header("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)))
			return c.json(
				{
					error: "Too many requests",
					retryAfter: Math.ceil((entry.resetAt - now) / 1000),
				},
				429,
			)
		}

		entry.count++
		c.header("X-RateLimit-Limit", String(MAX_REQUESTS))
		c.header("X-RateLimit-Remaining", String(MAX_REQUESTS - entry.count))
		c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)))
		await next()
	}
}
