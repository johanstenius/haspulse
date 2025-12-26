import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { AuthEnv } from "../../middleware/auth.js"
import { pingRateLimit } from "../../middleware/rate-limit.js"
import { requireApiKey } from "../../middleware/require-api-key.js"
import { processPing } from "./ping.handlers.js"
import { pingParamSchema, pingResponseSchema } from "./ping.schemas.js"

function getProjectId(c: { get: (key: "projectId") => string | null }): string {
	const projectId = c.get("projectId")
	if (!projectId) throw new Error("projectId not set")
	return projectId
}

const pingRoutes = new OpenAPIHono<AuthEnv>()

// Require API key for all ping routes
pingRoutes.use("/ping/*", requireApiKey)

// Rate limit by check slug
pingRoutes.use(
	"/ping/*",
	pingRateLimit((c) => {
		const projectId = c.get("projectId")
		const path = c.req.path
		const match = path.match(/^\/ping\/([^/]+)/)
		if (!match?.[1] || !projectId) return null
		return `${projectId}:${match[1].replace(/\/(start|fail)$/, "")}`
	}),
)

// Success ping
const pingRoute = createRoute({
	method: "get",
	path: "/ping/{slug}",
	request: { params: pingParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Ping recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record success ping",
})

const pingPostRoute = createRoute({
	method: "post",
	path: "/ping/{slug}",
	request: { params: pingParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Ping recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record success ping with body",
})

// Start signal
const pingStartRoute = createRoute({
	method: "get",
	path: "/ping/{slug}/start",
	request: { params: pingParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Start signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record start signal",
})

const pingStartPostRoute = createRoute({
	method: "post",
	path: "/ping/{slug}/start",
	request: { params: pingParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Start signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record start signal with body",
})

// Fail signal
const pingFailRoute = createRoute({
	method: "get",
	path: "/ping/{slug}/fail",
	request: { params: pingParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Fail signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record fail signal",
})

const pingFailPostRoute = createRoute({
	method: "post",
	path: "/ping/{slug}/fail",
	request: { params: pingParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Fail signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record fail signal with body",
})

// Register handlers
pingRoutes.openapi(pingRoute, async (c) => {
	const { slug } = c.req.valid("param")
	const result = await processPing(c, getProjectId(c), slug, "SUCCESS")
	return c.json(result, 200)
})

pingRoutes.openapi(pingPostRoute, async (c) => {
	const { slug } = c.req.valid("param")
	const result = await processPing(c, getProjectId(c), slug, "SUCCESS")
	return c.json(result, 200)
})

pingRoutes.openapi(pingStartRoute, async (c) => {
	const { slug } = c.req.valid("param")
	const result = await processPing(c, getProjectId(c), slug, "START")
	return c.json(result, 200)
})

pingRoutes.openapi(pingStartPostRoute, async (c) => {
	const { slug } = c.req.valid("param")
	const result = await processPing(c, getProjectId(c), slug, "START")
	return c.json(result, 200)
})

pingRoutes.openapi(pingFailRoute, async (c) => {
	const { slug } = c.req.valid("param")
	const result = await processPing(c, getProjectId(c), slug, "FAIL")
	return c.json(result, 200)
})

pingRoutes.openapi(pingFailPostRoute, async (c) => {
	const { slug } = c.req.valid("param")
	const result = await processPing(c, getProjectId(c), slug, "FAIL")
	return c.json(result, 200)
})

export { pingRoutes }
