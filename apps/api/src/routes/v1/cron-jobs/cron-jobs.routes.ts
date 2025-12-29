import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { Context } from "hono"
import {
	conflict,
	forbidden,
	limitExceeded,
	notFound,
} from "../../../lib/errors.js"
import { checkCronJobLimit } from "../../../lib/limits.js"
import { toCronJobResponse } from "../../../lib/mappers.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import {
	getApiKeyProjectId,
	getRequiredOrg,
	isApiKeyAuth,
	requireAuth,
} from "../../../middleware/auth.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import { pingRepository } from "../../../repositories/ping.repository.js"
import { listDefaultChannelsByProject } from "../../../services/channel.service.js"
import {
	type CronJobModel,
	createCronJob,
	deleteCronJob,
	getCronJobById,
	getCronJobChannelIds,
	listCronJobsByProjectPaginated,
	pauseCronJob,
	resumeCronJob,
	setCronJobChannelIds,
	slugExistsInProject,
	updateCronJob,
} from "../../../services/cron-job.service.js"
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
	createCronJobBodySchema,
	cronJobIdParamSchema,
	cronJobListQuerySchema,
	cronJobListResponseSchema,
	cronJobResponseSchema,
	durationStatsResponseSchema,
	errorResponseSchema,
	projectIdParamSchema,
	updateCronJobBodySchema,
} from "./cron-jobs.schemas.js"

// Routes for project-scoped operations (list, create)
// Mounted at /projects
const projectCronJobRoutes = new OpenAPIHono<AuthEnv>()
projectCronJobRoutes.use("*", requireAuth)

// Routes for direct cron job operations (get, update, delete, pause, resume)
// Mounted at /cron-jobs
const cronJobRoutes = new OpenAPIHono<AuthEnv>()
cronJobRoutes.use("*", requireAuth)

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

async function getAuthorizedCronJob(
	c: Context<AuthEnv>,
	cronJobId: string,
): Promise<CronJobModel> {
	const cronJob = await getCronJobById(cronJobId)
	if (!cronJob) throw notFound("Cron job not found")

	if (isApiKeyAuth(c)) {
		const apiKeyProjectId = getApiKeyProjectId(c)
		if (cronJob.projectId !== apiKeyProjectId)
			throw forbidden("API key not valid for this cron job")
	} else {
		const org = getRequiredOrg(c)
		await getProjectForOrg(cronJob.projectId, org.id)
	}

	return cronJob
}

const listCronJobsRoute = createRoute({
	method: "get",
	path: "/{projectId}/cron-jobs",
	request: { params: projectIdParamSchema, query: cronJobListQuerySchema },
	responses: {
		200: {
			content: { "application/json": { schema: cronJobListResponseSchema } },
			description: "Paginated list of cron jobs",
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
	tags: ["Cron Jobs"],
	summary: "List all cron jobs for a project",
})

const createCronJobRoute = createRoute({
	method: "post",
	path: "/{projectId}/cron-jobs",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createCronJobBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: cronJobResponseSchema } },
			description: "Cron job created",
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
	tags: ["Cron Jobs"],
	summary: "Create a new cron job",
})

const getCronJobRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: { params: cronJobIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: cronJobResponseSchema } },
			description: "Cron job details",
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
			description: "Cron job not found",
		},
	},
	tags: ["Cron Jobs"],
	summary: "Get cron job by ID",
})

const updateCronJobRoute = createRoute({
	method: "patch",
	path: "/{id}",
	request: {
		params: cronJobIdParamSchema,
		body: {
			content: { "application/json": { schema: updateCronJobBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: cronJobResponseSchema } },
			description: "Cron job updated",
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
			description: "Cron job not found",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Slug already exists",
		},
	},
	tags: ["Cron Jobs"],
	summary: "Update cron job",
})

const deleteCronJobRoute = createRoute({
	method: "delete",
	path: "/{id}",
	request: { params: cronJobIdParamSchema },
	responses: {
		204: { description: "Cron job deleted" },
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
			description: "Cron job not found",
		},
	},
	tags: ["Cron Jobs"],
	summary: "Delete cron job",
})

const pauseCronJobRoute = createRoute({
	method: "post",
	path: "/{id}/pause",
	request: { params: cronJobIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: cronJobResponseSchema } },
			description: "Cron job paused",
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
			description: "Cron job not found",
		},
	},
	tags: ["Cron Jobs"],
	summary: "Pause cron job monitoring",
})

const resumeCronJobRoute = createRoute({
	method: "post",
	path: "/{id}/resume",
	request: { params: cronJobIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: cronJobResponseSchema } },
			description: "Cron job resumed",
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
			description: "Cron job not found",
		},
	},
	tags: ["Cron Jobs"],
	summary: "Resume cron job monitoring",
})

const durationStatsRoute = createRoute({
	method: "get",
	path: "/{id}/duration-stats",
	request: { params: cronJobIdParamSchema },
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
			description: "Cron job not found",
		},
	},
	tags: ["Cron Jobs"],
	summary: "Get duration statistics for a cron job",
})

// Project-scoped routes
projectCronJobRoutes.openapi(listCronJobsRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	const { page, limit, search, status } = c.req.valid("query")
	const project = await getAuthorizedProject(c, projectId)
	const { data, total } = await listCronJobsByProjectPaginated(
		project.id,
		page,
		limit,
		{ search, status },
	)

	const cronJobIds = data.map((cronJob) => cronJob.id)
	const [channelIdsMap, pingsMap] = await Promise.all([
		Promise.all(data.map((cronJob) => getCronJobChannelIds(cronJob.id))).then(
			(results) => new Map(data.map((cronJob, i) => [cronJob.id, results[i]])),
		),
		pingRepository.findRecentByCronJobIds(cronJobIds, 20),
	])

	const cronJobs = data.map((cronJob) => {
		const pings = pingsMap.get(cronJob.id) ?? []
		const sparkline = calculateSparkline(cronJob, pings)
		return toCronJobResponse(
			cronJob,
			channelIdsMap.get(cronJob.id) ?? [],
			sparkline,
		)
	})

	return c.json(
		{ cronJobs, total, page, limit, totalPages: Math.ceil(total / limit) },
		200,
	)
})

projectCronJobRoutes.openapi(createCronJobRoute, async (c) => {
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

	const limitCheck = await checkCronJobLimit(orgId, plan)
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

	const cronJob = await createCronJob({
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

	// Auto-assign default channels from project
	const defaultChannels = await listDefaultChannelsByProject(project.id)
	const defaultChannelIds = defaultChannels.map((ch) => ch.id)
	if (defaultChannelIds.length > 0) {
		await setCronJobChannelIds(cronJob.id, defaultChannelIds)
	}

	return c.json(toCronJobResponse(cronJob, defaultChannelIds), 201)
})

// Direct cron job routes

cronJobRoutes.openapi(getCronJobRoute, async (c) => {
	const { id } = c.req.valid("param")
	const cronJob = await getAuthorizedCronJob(c, id)
	const [channelIds, pingsMap] = await Promise.all([
		getCronJobChannelIds(cronJob.id),
		pingRepository.findRecentByCronJobIds([cronJob.id], 20),
	])
	const pings = pingsMap.get(cronJob.id) ?? []
	const sparkline = calculateSparkline(cronJob, pings)
	return c.json(toCronJobResponse(cronJob, channelIds, sparkline), 200)
})

cronJobRoutes.openapi(updateCronJobRoute, async (c) => {
	const { id } = c.req.valid("param")
	const body = c.req.valid("json")
	const cronJob = await getAuthorizedCronJob(c, id)

	if (
		body.slug &&
		body.slug !== cronJob.slug &&
		(await slugExistsInProject(cronJob.projectId, body.slug))
	) {
		throw conflict("Slug already exists in this project")
	}

	const { channelIds, ...updateData } = body
	const updated = await updateCronJob(id, updateData)

	if (channelIds !== undefined) {
		await setCronJobChannelIds(id, channelIds)
	}

	const [finalChannelIds, pingsMap] = await Promise.all([
		getCronJobChannelIds(id),
		pingRepository.findRecentByCronJobIds([id], 20),
	])
	const pings = pingsMap.get(id) ?? []
	const sparkline = calculateSparkline(updated, pings)
	return c.json(toCronJobResponse(updated, finalChannelIds, sparkline), 200)
})

cronJobRoutes.openapi(deleteCronJobRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedCronJob(c, id)
	await deleteCronJob(id)
	return c.body(null, 204)
})

cronJobRoutes.openapi(pauseCronJobRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedCronJob(c, id)
	const paused = await pauseCronJob(id)
	const [channelIds, pingsMap] = await Promise.all([
		getCronJobChannelIds(id),
		pingRepository.findRecentByCronJobIds([id], 20),
	])
	const pings = pingsMap.get(id) ?? []
	const sparkline = calculateSparkline(paused, pings)
	return c.json(toCronJobResponse(paused, channelIds, sparkline), 200)
})

cronJobRoutes.openapi(resumeCronJobRoute, async (c) => {
	const { id } = c.req.valid("param")
	await getAuthorizedCronJob(c, id)
	const resumed = await resumeCronJob(id)
	const [channelIds, pingsMap] = await Promise.all([
		getCronJobChannelIds(id),
		pingRepository.findRecentByCronJobIds([id], 20),
	])
	const pings = pingsMap.get(id) ?? []
	const sparkline = calculateSparkline(resumed, pings)
	return c.json(toCronJobResponse(resumed, channelIds, sparkline), 200)
})

cronJobRoutes.openapi(durationStatsRoute, async (c) => {
	const { id } = c.req.valid("param")
	const cronJob = await getAuthorizedCronJob(c, id)
	const [stats, trend] = await Promise.all([
		getDurationStats(cronJob.id),
		getDurationTrend(cronJob.id),
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

export { cronJobRoutes, projectCronJobRoutes }
