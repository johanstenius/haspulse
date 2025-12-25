import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { checkRepository } from "../../repositories/check.repository.js"
import { projectRepository } from "../../repositories/project.repository.js"
import {
	badgeErrorSchema,
	badgeQuerySchema,
	checkBadgeParamSchema,
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

const getCheckBadgeRoute = createRoute({
	method: "get",
	path: "/badge/{projectSlug}/{checkSlug}",
	tags: ["Badge"],
	summary: "Get check status badge",
	description: "Returns an SVG badge showing the status of a specific check",
	request: {
		params: checkBadgeParamSchema,
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
			description: "Project or check not found",
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

	const checks = await checkRepository.findByProjectId(project.id)
	const activeChecks = checks.filter((check) => check.status !== "PAUSED")
	const statuses = activeChecks.map((check) => check.status)
	const overallStatus = getOverallStatus(statuses)

	const badgeLabel = label ?? project.name
	const svg = generateBadgeSvg(badgeLabel, overallStatus)

	return c.body(svg, 200, CACHE_HEADERS)
})

badgeRoutes.openapi(getCheckBadgeRoute, async (c) => {
	const { projectSlug, checkSlug } = c.req.valid("param")
	const { label } = c.req.valid("query")

	const project = await projectRepository.findBySlug(projectSlug)
	if (!project) {
		return c.json({ error: "Project not found" }, 404)
	}

	const checks = await checkRepository.findByProjectId(project.id)
	const check = checks.find((ch) => ch.slug === checkSlug)
	if (!check) {
		return c.json({ error: "Check not found" }, 404)
	}

	const badgeLabel = label ?? check.name
	const svg = generateBadgeSvg(badgeLabel, check.status)

	return c.body(svg, 200, CACHE_HEADERS)
})
