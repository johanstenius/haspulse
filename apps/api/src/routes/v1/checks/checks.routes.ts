import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { Context } from "hono"
import {
	conflict,
	forbidden,
	limitExceeded,
	notFound,
} from "../../../lib/errors.js"
import { checkCheckLimit } from "../../../lib/limits.js"
import { toCheckResponse } from "../../../lib/mappers.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import {
	getApiKeyProjectId,
	getRequiredOrg,
	isApiKeyAuth,
	requireAuth,
} from "../../../middleware/auth.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import { pingRepository } from "../../../repositories/ping.repository.js"
import {
	type CheckModel,
	createCheck,
	deleteCheck,
	getCheckById,
	getCheckChannelIds,
	listChecksByProjectPaginated,
	pauseCheck,
	resumeCheck,
	setCheckChannelIds,
	slugExistsInProject,
	updateCheck,
} from "../../../services/check.service.js"
import {
	getDurationStats,
	getDurationTrend,
} from "../../../services/duration.service.js"
import { getEffectivePlan } from "../../../services/organization.service.js"
import {
	getProjectById,
	getProjectForOrg,
} from "../../../services/project.service.js"
import { calculateSparkline } from "../../../services/sparkline.service.js"
import {
	checkIdParamSchema,
	checkListQuerySchema,
	checkListResponseSchema,
	checkResponseSchema,
	createCheckBodySchema,
	durationStatsResponseSchema,
	errorResponseSchema,
	projectIdParamSchema,
	updateCheckBodySchema,
} from "./checks.schemas.js"

// Routes for project-scoped operations (list, create)
// Mounted at /projects
const projectCheckRoutes = new OpenAPIHono<AuthEnv>()
projectCheckRoutes.use("*", requireAuth)

// Routes for direct check operations (get, update, delete, pause, resume)
// Mounted at /checks
const checkRoutes = new OpenAPIHono<AuthEnv>()
checkRoutes.use("*", requireAuth)

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

async function getAuthorizedCheck(
	c: Context<AuthEnv>,
	checkId: string,
): Promise<CheckModel> {
	const check = await getCheckById(checkId)
	if (!check) throw notFound("Check not found")

	if (isApiKeyAuth(c)) {
		const apiKeyProjectId = getApiKeyProjectId(c)
		if (check.projectId !== apiKeyProjectId)
			throw forbidden("API key not valid for this check")
	} else {
		const org = getRequiredOrg(c)
		await getProjectForOrg(check.projectId, org.id)
	}

	return check
}

const listChecksRoute = createRoute({
	method: "get",
	path: "/{projectId}/checks",
	request: { params: projectIdParamSchema, query: checkListQuerySchema },
	responses: {
		200: {
			content: { "application/json": { schema: checkListResponseSchema } },
			description: "Paginated list of checks",
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
	tags: ["Checks"],
	summary: "List all checks for a project",
})

const createCheckRoute = createRoute({
	method: "post",
	path: "/{projectId}/checks",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createCheckBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: checkResponseSchema } },
			description: "Check created",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Forbidden",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Slug already exists",
		},
	},
	tags: ["Checks"],
	summary: "Create a new check",
})

const getCheckRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: { params: checkIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: checkResponseSchema } },
			description: "Check details",
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
			description: "Check not found",
		},
	},
	tags: ["Checks"],
	summary: "Get check by ID",
})

const updateCheckRoute = createRoute({
	method: "patch",
	path: "/{id}",
	request: {
		params: checkIdParamSchema,
		body: {
			content: { "application/json": { schema: updateCheckBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: checkResponseSchema } },
			description: "Check updated",
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
			description: "Check not found",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Slug already exists",
		},
	},
	tags: ["Checks"],
	summary: "Update check",
})

const deleteCheckRoute = createRoute({
	method: "delete",
	path: "/{id}",
	request: { params: checkIdParamSchema },
	responses: {
		204: { description: "Check deleted" },
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
			description: "Check not found",
		},
	},
	tags: ["Checks"],
	summary: "Delete check",
})

const pauseCheckRoute = createRoute({
	method: "post",
	path: "/{id}/pause",
	request: { params: checkIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: checkResponseSchema } },
			description: "Check paused",
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
			description: "Check not found",
		},
	},
	tags: ["Checks"],
	summary: "Pause check monitoring",
})

const resumeCheckRoute = createRoute({
	method: "post",
	path: "/{id}/resume",
	request: { params: checkIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: checkResponseSchema } },
			description: "Check resumed",
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
			description: "Check not found",
		},
	},
	tags: ["Checks"],
	summary: "Resume check monitoring",
})

const durationStatsRoute = createRoute({
	method: "get",
	path: "/{id}/duration-stats",
	request: { params: checkIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: durationStatsResponseSchema } },
			description: "Duration statistics",
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
			description: "Check not found",
		},
	},
	tags: ["Checks"],
	summary: "Get duration statistics for a check",
})

// Project-scoped routes
projectCheckRoutes.openapi(listChecksRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	const { page, limit, search, status } = c.req.valid("query")
	const project = await getAuthorizedProject(c, projectId)
	const { data, total } = await listChecksByProjectPaginated(
		project.id,
		page,
		limit,
		{ search, status },
	)

	const checkIds = data.map((check) => check.id)
	const [channelIdsMap, pingsMap] = await Promise.all([
		Promise.all(data.map((check) => getCheckChannelIds(check.id))).then(
			(results) => new Map(data.map((check, i) => [check.id, results[i]])),
		),
		pingRepository.findRecentByCheckIds(checkIds, 20),
	])

	const checks = data.map((check) => {
		const pings = pingsMap.get(check.id) ?? []
		const sparkline = calculateSparkline(check, pings)
		return toCheckResponse(check, channelIdsMap.get(check.id) ?? [], sparkline)
	})

	return c.json(
		{ checks, total, page, limit, totalPages: Math.ceil(total / limit) },
		200,
	)
})

projectCheckRoutes.openapi(createCheckRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	const body = c.req.valid("json")
	const project = await getAuthorizedProject(c, projectId)

	// Check limits - need org for both API key and session auth
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

	const limitCheck = await checkCheckLimit(orgId, plan)
	if (!limitCheck.allowed) {
		throw limitExceeded(
			limitCheck.resource,
			limitCheck.limit,
			limitCheck.current,
		)
	}

	if (body.slug && (await slugExistsInProject(project.id, body.slug))) {
		throw conflict("Slug already exists in this project")
	}

	const check = await createCheck({
		projectId: project.id,
		name: body.name,
		slug: body.slug,
		scheduleType: body.scheduleType,
		scheduleValue: body.scheduleValue,
		graceSeconds: body.graceSeconds,
		alertOnRecovery: body.alertOnRecovery,
		reminderIntervalHours: body.reminderIntervalHours,
		anomalySensitivity: body.anomalySensitivity,
	})

	return c.json(toCheckResponse(check, []), 201)
})

// Direct check routes

checkRoutes.openapi(getCheckRoute, async (c) => {
	const { id } = c.req.valid("param")
	const check = await getAuthorizedCheck(c, id)
	const [channelIds, pingsMap] = await Promise.all([
		getCheckChannelIds(check.id),
		pingRepository.findRecentByCheckIds([check.id], 20),
	])
	const pings = pingsMap.get(check.id) ?? []
	const sparkline = calculateSparkline(check, pings)
	return c.json(toCheckResponse(check, channelIds, sparkline), 200)
})

checkRoutes.openapi(updateCheckRoute, async (c) => {
	const { id } = c.req.valid("param")
	const body = c.req.valid("json")
	const check = await getAuthorizedCheck(c, id)

	if (
		body.slug &&
		body.slug !== check.slug &&
		(await slugExistsInProject(check.projectId, body.slug))
	) {
		throw conflict("Slug already exists in this project")
	}

	const { channelIds, ...updateData } = body
	const updated = await updateCheck(id, updateData)

	if (channelIds !== undefined) {
		await setCheckChannelIds(id, channelIds)
	}

	const [finalChannelIds, pingsMap] = await Promise.all([
		getCheckChannelIds(id),
		pingRepository.findRecentByCheckIds([id], 20),
	])
	const pings = pingsMap.get(id) ?? []
	const sparkline = calculateSparkline(updated, pings)
	return c.json(toCheckResponse(updated, finalChannelIds, sparkline), 200)
})

checkRoutes.openapi(deleteCheckRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedCheck(c, id)
	await deleteCheck(id)
	return c.body(null, 204)
})

checkRoutes.openapi(pauseCheckRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedCheck(c, id)
	const paused = await pauseCheck(id)
	const [channelIds, pingsMap] = await Promise.all([
		getCheckChannelIds(id),
		pingRepository.findRecentByCheckIds([id], 20),
	])
	const pings = pingsMap.get(id) ?? []
	const sparkline = calculateSparkline(paused, pings)
	return c.json(toCheckResponse(paused, channelIds, sparkline), 200)
})

checkRoutes.openapi(resumeCheckRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedCheck(c, id)
	const resumed = await resumeCheck(id)
	const [channelIds, pingsMap] = await Promise.all([
		getCheckChannelIds(id),
		pingRepository.findRecentByCheckIds([id], 20),
	])
	const pings = pingsMap.get(id) ?? []
	const sparkline = calculateSparkline(resumed, pings)
	return c.json(toCheckResponse(resumed, channelIds, sparkline), 200)
})

checkRoutes.openapi(durationStatsRoute, async (c) => {
	const { id } = c.req.valid("param")
	const check = await getAuthorizedCheck(c, id)
	const [stats, trend] = await Promise.all([
		getDurationStats(check.id),
		getDurationTrend(check.id),
	])

	return c.json(
		{
			current: stats
				? {
						avgMs: stats.avgDurationMs,
						p50Ms: stats.p50DurationMs,
						p95Ms: stats.p95DurationMs,
						p99Ms: stats.p99DurationMs,
						sampleCount: stats.sampleCount,
					}
				: null,
			trend: {
				last5: trend.last5Durations,
				direction: trend.trendDirection,
			},
			isAnomaly: trend.isAnomaly,
		},
		200,
	)
})

export { checkRoutes, projectCheckRoutes }
