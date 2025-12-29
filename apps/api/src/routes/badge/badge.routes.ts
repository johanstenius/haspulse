import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { cronJobRepository } from "../../repositories/cron-job.repository.js"
import { projectRepository } from "../../repositories/project.repository.js"
import {
	badgeErrorSchema,
	badgeQuerySchema,
	cronJobBadgeParamSchema,
	projectBadgeParamSchema,
} from "./badge.schemas.js"
import { generateBadgeSvg, getOverallStatus } from "./badge.svg.js"

export const badgeRoutes = new OpenAPIHono()

const CACHE_HEADERS = {
	"Cache-Control": "max-age=300, s-maxage=300, public",
	"Content-Type": "image/svg+xml",
}

const getProjectBadgeRoute = createRoute({
	method: "get",
	path: "/badge/{projectSlug}",
	tags: ["Badge"],
	summary: "Get project status badge",
	description: "Returns an SVG badge showing the overall status of a project",
	request: {
		params: projectBadgeParamSchema,
		query: badgeQuerySchema,
	},
	responses: {
		200: {
			description: "SVG badge",
			content: {
				"image/svg+xml": {
					schema: { type: "string" },
				},
			},
		},
		404: {
			content: {
				"application/json": {
					schema: badgeErrorSchema,
				},
			},
			description: "Project not found",
		},
	},
})

const getCronJobBadgeRoute = createRoute({
	method: "get",
	path: "/badge/{projectSlug}/{cronJobSlug}",
	tags: ["Badge"],
	summary: "Get cron job status badge",
	description: "Returns an SVG badge showing the status of a specific cron job",
	request: {
		params: cronJobBadgeParamSchema,
		query: badgeQuerySchema,
	},
	responses: {
		200: {
			description: "SVG badge",
			content: {
				"image/svg+xml": {
					schema: { type: "string" },
				},
			},
		},
		404: {
			content: {
				"application/json": {
					schema: badgeErrorSchema,
				},
			},
			description: "Project or cron job not found",
		},
	},
})

badgeRoutes.openapi(getProjectBadgeRoute, async (c) => {
	const { projectSlug } = c.req.valid("param")
	const { label } = c.req.valid("query")

	const project = await projectRepository.findBySlug(projectSlug)
	if (!project) {
		return c.json({ error: "Project not found" }, 404)
	}

	const cronJobs = await cronJobRepository.findByProjectId(project.id)
	const activeCronJobs = cronJobs.filter(
		(cronJob) => cronJob.status !== "PAUSED",
	)
	const statuses = activeCronJobs.map((cronJob) => cronJob.status)
	const overallStatus = getOverallStatus(statuses)

	const badgeLabel = label ?? project.name
	const svg = generateBadgeSvg(badgeLabel, overallStatus)

	return c.body(svg, 200, CACHE_HEADERS)
})

badgeRoutes.openapi(getCronJobBadgeRoute, async (c) => {
	const { projectSlug, cronJobSlug } = c.req.valid("param")
	const { label } = c.req.valid("query")

	const project = await projectRepository.findBySlug(projectSlug)
	if (!project) {
		return c.json({ error: "Project not found" }, 404)
	}

	const cronJobs = await cronJobRepository.findByProjectId(project.id)
	const cronJob = cronJobs.find((cj) => cj.slug === cronJobSlug)
	if (!cronJob) {
		return c.json({ error: "Cron job not found" }, 404)
	}

	const badgeLabel = label ?? cronJob.name
	const svg = generateBadgeSvg(badgeLabel, cronJob.status)

	return c.body(svg, 200, CACHE_HEADERS)
})
