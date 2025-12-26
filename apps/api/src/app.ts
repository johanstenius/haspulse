import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { Session, User } from "better-auth"
import { cors } from "hono/cors"
import { config } from "./env.js"
import { auth } from "./lib/auth.js"
import { AppError } from "./lib/errors.js"
import { logger } from "./lib/logger.js"
import { badgeRoutes } from "./routes/badge/badge.routes.js"
import { pingRoutes } from "./routes/ping/ping.routes.js"
import { v1Routes } from "./routes/v1/index.js"
import { stripeWebhookRoutes } from "./routes/webhooks/stripe.routes.js"

export type OrgContext = {
	id: string
	plan: "free" | "pro"
	role: string
	trialEndsAt: Date | null
}

export type AppEnv = {
	Variables: {
		user: User | null
		session: Session | null
		org: OrgContext | null
	}
}

export function createApp() {
	const app = new OpenAPIHono<AppEnv>()

	// CORS
	app.use(
		"*",
		cors({
			origin: config.appUrl,
			credentials: true,
			allowHeaders: ["Content-Type", "Authorization", "X-Org-Id"],
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		}),
	)

	// Request logging
	app.use("*", async (c, next) => {
		const start = Date.now()
		await next()
		const duration = Date.now() - start
		const path = new URL(c.req.url).pathname
		if (path !== "/health") {
			logger.info({
				method: c.req.method,
				path,
				status: c.res.status,
				duration,
			})
		}
	})

	// Health check (before auth)
	app.get("/health", (c) => c.json({ ok: true }))

	// BetterAuth handler
	app.on(["POST", "GET"], "/auth/*", (c) => {
		return auth.handler(c.req.raw)
	})

	// Stripe webhooks (before session middleware, no auth required)
	app.route("/webhooks", stripeWebhookRoutes)

	// Session middleware
	app.use("*", async (c, next) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		})
		c.set("user", session?.user ?? null)
		c.set("session", session?.session ?? null)
		c.set("org", null)
		await next()
	})

	// Mount ping routes (public, no auth required)
	app.route("/", pingRoutes)

	// Mount badge routes (public, no auth required)
	app.route("/", badgeRoutes)

	// Mount v1 management API
	app.route("/v1", v1Routes)

	// OpenAPI docs
	app.doc("/openapi.json", {
		openapi: "3.1.0",
		info: {
			title: "HasPulse API",
			version: "1.0.0",
			description: "Cron monitoring that just works",
		},
	})

	app.get("/docs", swaggerUI({ url: "/openapi.json" }))

	// Error handler
	app.onError((err, c) => {
		if (err instanceof AppError) {
			return c.json(
				{ error: { code: err.code, message: err.message } },
				err.status as 400,
			)
		}
		logger.error({ err, path: c.req.path }, "Unhandled error")
		return c.json(
			{ error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
			500,
		)
	})

	return app
}

export type App = ReturnType<typeof createApp>
