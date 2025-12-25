import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { pingRateLimit } from "../../middleware/rate-limit.js"
import { processPingById, processPingBySlug } from "./ping.handlers.js"
import {
	pingByIdParamSchema,
	pingBySlugParamSchema,
	pingResponseSchema,
} from "./ping.schemas.js"

const pingRoutes = new OpenAPIHono()

// Rate limit by check identifier extracted from URL
pingRoutes.use(
	"/ping/*",
	pingRateLimit((c) => {
		const path = c.req.path
		// Extract identifier: /ping/{id} or /ping/{project}/{check}
		const match = path.match(/^\/ping\/([^/]+(?:\/[^/]+)?)/)
		if (!match?.[1]) return null
		return match[1].replace(/\/(start|fail)$/, "")
	}),
)

// Ping by ID - success
const pingByIdRoute = createRoute({
	method: "get",
	path: "/ping/{id}",
	request: { params: pingByIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Ping recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record success ping by check ID",
})

const pingByIdPostRoute = createRoute({
	method: "post",
	path: "/ping/{id}",
	request: { params: pingByIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Ping recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record success ping by check ID (with body)",
})

// Ping by ID - start
const pingByIdStartRoute = createRoute({
	method: "get",
	path: "/ping/{id}/start",
	request: { params: pingByIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Start signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record start signal by check ID",
})

const pingByIdStartPostRoute = createRoute({
	method: "post",
	path: "/ping/{id}/start",
	request: { params: pingByIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Start signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record start signal by check ID (with body)",
})

// Ping by ID - fail
const pingByIdFailRoute = createRoute({
	method: "get",
	path: "/ping/{id}/fail",
	request: { params: pingByIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Fail signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record fail signal by check ID",
})

const pingByIdFailPostRoute = createRoute({
	method: "post",
	path: "/ping/{id}/fail",
	request: { params: pingByIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Fail signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record fail signal by check ID (with body)",
})

// Ping by slug - success
const pingBySlugRoute = createRoute({
	method: "get",
	path: "/ping/{projectSlug}/{checkSlug}",
	request: { params: pingBySlugParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Ping recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record success ping by project/check slug",
})

const pingBySlugPostRoute = createRoute({
	method: "post",
	path: "/ping/{projectSlug}/{checkSlug}",
	request: { params: pingBySlugParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Ping recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record success ping by project/check slug (with body)",
})

// Ping by slug - start
const pingBySlugStartRoute = createRoute({
	method: "get",
	path: "/ping/{projectSlug}/{checkSlug}/start",
	request: { params: pingBySlugParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Start signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record start signal by project/check slug",
})

const pingBySlugStartPostRoute = createRoute({
	method: "post",
	path: "/ping/{projectSlug}/{checkSlug}/start",
	request: { params: pingBySlugParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Start signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record start signal by project/check slug (with body)",
})

// Ping by slug - fail
const pingBySlugFailRoute = createRoute({
	method: "get",
	path: "/ping/{projectSlug}/{checkSlug}/fail",
	request: { params: pingBySlugParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Fail signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record fail signal by project/check slug",
})

const pingBySlugFailPostRoute = createRoute({
	method: "post",
	path: "/ping/{projectSlug}/{checkSlug}/fail",
	request: { params: pingBySlugParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: pingResponseSchema } },
			description: "Fail signal recorded",
		},
	},
	tags: ["Ping"],
	summary: "Record fail signal by project/check slug (with body)",
})

// Register handlers
pingRoutes.openapi(pingByIdRoute, async (c) => {
	const { id } = c.req.valid("param")
	const result = await processPingById(c, id)
	return c.json(result, 200)
})

pingRoutes.openapi(pingByIdPostRoute, async (c) => {
	const { id } = c.req.valid("param")
	const result = await processPingById(c, id)
	return c.json(result, 200)
})

pingRoutes.openapi(pingByIdStartRoute, async (c) => {
	const { id } = c.req.valid("param")
	const result = await processPingById(c, id, "start")
	return c.json(result, 200)
})

pingRoutes.openapi(pingByIdStartPostRoute, async (c) => {
	const { id } = c.req.valid("param")
	const result = await processPingById(c, id, "start")
	return c.json(result, 200)
})

pingRoutes.openapi(pingByIdFailRoute, async (c) => {
	const { id } = c.req.valid("param")
	const result = await processPingById(c, id, "fail")
	return c.json(result, 200)
})

pingRoutes.openapi(pingByIdFailPostRoute, async (c) => {
	const { id } = c.req.valid("param")
	const result = await processPingById(c, id, "fail")
	return c.json(result, 200)
})

pingRoutes.openapi(pingBySlugRoute, async (c) => {
	const { projectSlug, checkSlug } = c.req.valid("param")
	const result = await processPingBySlug(c, projectSlug, checkSlug)
	return c.json(result, 200)
})

pingRoutes.openapi(pingBySlugPostRoute, async (c) => {
	const { projectSlug, checkSlug } = c.req.valid("param")
	const result = await processPingBySlug(c, projectSlug, checkSlug)
	return c.json(result, 200)
})

pingRoutes.openapi(pingBySlugStartRoute, async (c) => {
	const { projectSlug, checkSlug } = c.req.valid("param")
	const result = await processPingBySlug(c, projectSlug, checkSlug, "start")
	return c.json(result, 200)
})

pingRoutes.openapi(pingBySlugStartPostRoute, async (c) => {
	const { projectSlug, checkSlug } = c.req.valid("param")
	const result = await processPingBySlug(c, projectSlug, checkSlug, "start")
	return c.json(result, 200)
})

pingRoutes.openapi(pingBySlugFailRoute, async (c) => {
	const { projectSlug, checkSlug } = c.req.valid("param")
	const result = await processPingBySlug(c, projectSlug, checkSlug, "fail")
	return c.json(result, 200)
})

pingRoutes.openapi(pingBySlugFailPostRoute, async (c) => {
	const { projectSlug, checkSlug } = c.req.valid("param")
	const result = await processPingBySlug(c, projectSlug, checkSlug, "fail")
	return c.json(result, 200)
})

export { pingRoutes }
