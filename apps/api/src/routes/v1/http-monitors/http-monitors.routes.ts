import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { Context } from "hono"
import { forbidden, limitExceeded, notFound } from "../../../lib/errors.js"
import { checkHttpMonitorLimit } from "../../../lib/limits.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import {
	getApiKeyProjectId,
	getRequiredOrg,
	isApiKeyAuth,
	requireAuth,
} from "../../../middleware/auth.js"
import { httpMonitorRepository } from "../../../repositories/http-monitor.repository.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import { listDefaultChannelsByProject } from "../../../services/channel.service.js"
import {
	type HttpMonitorModel,
	createHttpMonitor,
	deleteHttpMonitor,
	getHttpMonitorById,
	getHttpMonitorChannelIds,
	listHttpMonitorsByProjectPaginated,
	pauseHttpMonitor,
	resumeHttpMonitor,
	setHttpMonitorChannelIds,
	updateHttpMonitor,
} from "../../../services/http-monitor.service.js"
import { getEffectivePlan } from "../../../services/organization.service.js"
import {
	getProjectById,
	getProjectForOrg,
} from "../../../services/project.service.js"
import {
	createHttpMonitorBodySchema,
	errorResponseSchema,
	httpMonitorIdParamSchema,
	httpMonitorListQuerySchema,
	httpMonitorListResponseSchema,
	httpMonitorResponseSchema,
	projectIdParamSchema,
	updateHttpMonitorBodySchema,
} from "./http-monitors.schemas.js"

// Routes for project-scoped operations (list, create)
const projectHttpMonitorRoutes = new OpenAPIHono<AuthEnv>()
projectHttpMonitorRoutes.use("*", requireAuth)

// Routes for direct http monitor operations (get, update, delete, pause, resume)
const httpMonitorRoutes = new OpenAPIHono<AuthEnv>()
httpMonitorRoutes.use("*", requireAuth)

type SparklineSlot = "success" | "fail" | "missed" | "empty"

function toHttpMonitorResponse(
	monitor: HttpMonitorModel,
	channelIds: string[],
	sparkline: SparklineSlot[] = [],
) {
	return {
		id: monitor.id,
		projectId: monitor.projectId,
		name: monitor.name,
		url: monitor.url,
		method: monitor.method,
		headers: monitor.headers,
		body: monitor.body,
		timeout: monitor.timeout,
		expectedStatus: monitor.expectedStatus,
		expectedBody: monitor.expectedBody,
		interval: monitor.interval,
		graceSeconds: monitor.graceSeconds,
		status: monitor.status,
		lastCheckedAt: monitor.lastCheckedAt?.toISOString() ?? null,
		lastResponseMs: monitor.lastResponseMs,
		nextCheckAt: monitor.nextCheckAt?.toISOString() ?? null,
		alertOnRecovery: monitor.alertOnRecovery,
		channelIds,
		sparkline,
		createdAt: monitor.createdAt.toISOString(),
		updatedAt: monitor.updatedAt.toISOString(),
	}
}

function calculateHttpSparkline(
	pollResults: Array<{ success: boolean; createdAt: Date }>,
): SparklineSlot[] {
	const slots: SparklineSlot[] = []
	// Show last 20 results, most recent first
	const results = pollResults.slice(0, 20)
	for (const result of results) {
		slots.push(result.success ? "success" : "fail")
	}
	// Pad with empty if less than 20
	while (slots.length < 20) {
		slots.push("empty")
	}
	return slots.reverse() // oldest first for display
}

async function getAuthorizedProject(c: Context<AuthEnv>, projectId: string) {
	if (isApiKeyAuth(c)) {
		const apiKeyProjectId = getApiKeyProjectId(c)
		if (apiKeyProjectId !== projectId) {
			throw forbidden("API key not valid for this project")
		}
		const project = await getProjectById(projectId)
		if (!project) throw notFound("Project not found")
		return project
	}

	const org = getRequiredOrg(c)
	return getProjectForOrg(projectId, org.id)
}

async function getAuthorizedHttpMonitor(
	c: Context<AuthEnv>,
	httpMonitorId: string,
): Promise<HttpMonitorModel> {
	const monitor = await getHttpMonitorById(httpMonitorId)
	if (!monitor) throw notFound("HTTP monitor not found")

	if (isApiKeyAuth(c)) {
		const apiKeyProjectId = getApiKeyProjectId(c)
		if (monitor.projectId !== apiKeyProjectId)
			throw forbidden("API key not valid for this HTTP monitor")
	} else {
		const org = getRequiredOrg(c)
		await getProjectForOrg(monitor.projectId, org.id)
	}

	return monitor
}

const listHttpMonitorsRoute = createRoute({
	method: "get",
	path: "/{projectId}/http-monitors",
	request: { params: projectIdParamSchema, query: httpMonitorListQuerySchema },
	responses: {
		200: {
			content: {
				"application/json": { schema: httpMonitorListResponseSchema },
			},
			description: "Paginated list of HTTP monitors",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
	},
	tags: ["HTTP Monitors"],
	summary: "List all HTTP monitors for a project",
})

const createHttpMonitorRoute = createRoute({
	method: "post",
	path: "/{projectId}/http-monitors",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createHttpMonitorBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: httpMonitorResponseSchema } },
			description: "HTTP monitor created",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
	},
	tags: ["HTTP Monitors"],
	summary: "Create a new HTTP monitor",
})

const getHttpMonitorRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: { params: httpMonitorIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: httpMonitorResponseSchema } },
			description: "HTTP monitor details",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "HTTP monitor not found",
		},
	},
	tags: ["HTTP Monitors"],
	summary: "Get HTTP monitor by ID",
})

const updateHttpMonitorRoute = createRoute({
	method: "patch",
	path: "/{id}",
	request: {
		params: httpMonitorIdParamSchema,
		body: {
			content: { "application/json": { schema: updateHttpMonitorBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: httpMonitorResponseSchema } },
			description: "HTTP monitor updated",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "HTTP monitor not found",
		},
	},
	tags: ["HTTP Monitors"],
	summary: "Update HTTP monitor",
})

const deleteHttpMonitorRoute = createRoute({
	method: "delete",
	path: "/{id}",
	request: { params: httpMonitorIdParamSchema },
	responses: {
		204: { description: "HTTP monitor deleted" },
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "HTTP monitor not found",
		},
	},
	tags: ["HTTP Monitors"],
	summary: "Delete HTTP monitor",
})

const pauseHttpMonitorRoute = createRoute({
	method: "post",
	path: "/{id}/pause",
	request: { params: httpMonitorIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: httpMonitorResponseSchema } },
			description: "HTTP monitor paused",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "HTTP monitor not found",
		},
	},
	tags: ["HTTP Monitors"],
	summary: "Pause HTTP monitor",
})

const resumeHttpMonitorRoute = createRoute({
	method: "post",
	path: "/{id}/resume",
	request: { params: httpMonitorIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: httpMonitorResponseSchema } },
			description: "HTTP monitor resumed",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "HTTP monitor not found",
		},
	},
	tags: ["HTTP Monitors"],
	summary: "Resume HTTP monitor",
})

// Project-scoped routes
projectHttpMonitorRoutes.openapi(listHttpMonitorsRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	const { page, limit, search, status } = c.req.valid("query")
	const project = await getAuthorizedProject(c, projectId)
	const { data, total } = await listHttpMonitorsByProjectPaginated(
		project.id,
		page,
		limit,
		{ search, status },
	)

	const monitorIds = data.map((m) => m.id)
	const [channelIdsMap, pollResultsMap] = await Promise.all([
		Promise.all(data.map((m) => getHttpMonitorChannelIds(m.id))).then(
			(results) => new Map(data.map((m, i) => [m.id, results[i]])),
		),
		httpMonitorRepository.findRecentPollResultsByMonitorIds(monitorIds, 20),
	])

	const httpMonitors = data.map((monitor) => {
		const pollResults = pollResultsMap.get(monitor.id) ?? []
		const sparkline = calculateHttpSparkline(pollResults)
		return toHttpMonitorResponse(
			monitor,
			channelIdsMap.get(monitor.id) ?? [],
			sparkline,
		)
	})

	return c.json(
		{ httpMonitors, total, page, limit, totalPages: Math.ceil(total / limit) },
		200,
	)
})

projectHttpMonitorRoutes.openapi(createHttpMonitorRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	const body = c.req.valid("json")
	const project = await getAuthorizedProject(c, projectId)

	// Check limits
	let orgId: string
	let plan: "free" | "pro"
	if (isApiKeyAuth(c)) {
		orgId = project.orgId
		const org = await organizationRepository.findById(orgId)
		if (!org) throw forbidden("Organization not found")
		plan = await getEffectivePlan(org)
	} else {
		const org = getRequiredOrg(c)
		orgId = org.id
		plan = org.plan
	}

	const limitCheck = await checkHttpMonitorLimit(orgId, plan)
	if (!limitCheck.allowed) {
		throw limitExceeded(
			limitCheck.resource,
			limitCheck.limit,
			limitCheck.current,
		)
	}

	const monitor = await createHttpMonitor({
		projectId: project.id,
		name: body.name,
		url: body.url,
		method: body.method,
		headers: body.headers,
		body: body.body,
		timeout: body.timeout,
		expectedStatus: body.expectedStatus,
		expectedBody: body.expectedBody,
		interval: body.interval,
		graceSeconds: body.graceSeconds,
		alertOnRecovery: body.alertOnRecovery,
	})

	// Auto-assign default channels from project
	const defaultChannels = await listDefaultChannelsByProject(project.id)
	const defaultChannelIds = defaultChannels.map((ch) => ch.id)
	if (defaultChannelIds.length > 0) {
		await setHttpMonitorChannelIds(monitor.id, defaultChannelIds)
	}

	return c.json(toHttpMonitorResponse(monitor, defaultChannelIds), 201)
})

// Direct http monitor routes
httpMonitorRoutes.openapi(getHttpMonitorRoute, async (c) => {
	const { id } = c.req.valid("param")
	const monitor = await getAuthorizedHttpMonitor(c, id)
	const [channelIds, pollResults] = await Promise.all([
		getHttpMonitorChannelIds(monitor.id),
		httpMonitorRepository.findRecentPollResults(monitor.id, 20),
	])
	const sparkline = calculateHttpSparkline(pollResults)
	return c.json(toHttpMonitorResponse(monitor, channelIds, sparkline), 200)
})

httpMonitorRoutes.openapi(updateHttpMonitorRoute, async (c) => {
	const { id } = c.req.valid("param")
	const body = c.req.valid("json")
	await getAuthorizedHttpMonitor(c, id)

	const { channelIds, ...updateData } = body
	const updated = await updateHttpMonitor(id, updateData)

	if (channelIds !== undefined) {
		await setHttpMonitorChannelIds(id, channelIds)
	}

	const [finalChannelIds, pollResults] = await Promise.all([
		getHttpMonitorChannelIds(id),
		httpMonitorRepository.findRecentPollResults(id, 20),
	])
	const sparkline = calculateHttpSparkline(pollResults)
	return c.json(toHttpMonitorResponse(updated, finalChannelIds, sparkline), 200)
})

httpMonitorRoutes.openapi(deleteHttpMonitorRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedHttpMonitor(c, id)
	await deleteHttpMonitor(id)
	return c.body(null, 204)
})

httpMonitorRoutes.openapi(pauseHttpMonitorRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedHttpMonitor(c, id)
	const paused = await pauseHttpMonitor(id)
	const [channelIds, pollResults] = await Promise.all([
		getHttpMonitorChannelIds(id),
		httpMonitorRepository.findRecentPollResults(id, 20),
	])
	const sparkline = calculateHttpSparkline(pollResults)
	return c.json(toHttpMonitorResponse(paused, channelIds, sparkline), 200)
})

httpMonitorRoutes.openapi(resumeHttpMonitorRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedHttpMonitor(c, id)
	const resumed = await resumeHttpMonitor(id)
	const [channelIds, pollResults] = await Promise.all([
		getHttpMonitorChannelIds(id),
		httpMonitorRepository.findRecentPollResults(id, 20),
	])
	const sparkline = calculateHttpSparkline(pollResults)
	return c.json(toHttpMonitorResponse(resumed, channelIds, sparkline), 200)
})

export { httpMonitorRoutes, projectHttpMonitorRoutes }
