import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { checkRepository } from "../../repositories/check.repository.js"
import { incidentRepository } from "../../repositories/incident.repository.js"
import { maintenanceRepository } from "../../repositories/maintenance.repository.js"
import { projectRepository } from "../../repositories/project.repository.js"
import type { ProjectModel } from "../../services/project.service.js"
import { getChecksUptimeHistory } from "../../services/stats.service.js"
import {
	statusDomainQuerySchema,
	statusErrorSchema,
	statusPageResponseSchema,
	statusProjectSlugParamSchema,
} from "./status.schemas.js"

export const statusRoutes = new OpenAPIHono()

async function buildStatusPageResponse(project: ProjectModel) {
	const [checks, activeIncidents, activeMaintenance, upcomingMaintenance] =
		await Promise.all([
			checkRepository.findByProjectId(project.id),
			incidentRepository.findActiveByProjectId(project.id),
			maintenanceRepository.findActiveByProjectId(project.id),
			maintenanceRepository.findUpcomingByProjectId(project.id, 5),
		])

	const visibleChecks = checks.filter((check) => check.status !== "PAUSED")
	const checkIds = visibleChecks.map((c) => c.id)

	const uptimeMap = await getChecksUptimeHistory(checkIds, 90)

	const checksWithUptime = visibleChecks.map((check) => ({
		id: check.id,
		name: check.name,
		status: check.status,
		lastPingAt: check.lastPingAt?.toISOString() ?? null,
		uptimeDays: uptimeMap.get(check.id) ?? [],
	}))

	const incidentsWithUpdates = await Promise.all(
		activeIncidents.map(async (incident) => {
			const updates = await incidentRepository.getUpdates(incident.id)
			return {
				id: incident.id,
				title: incident.title,
				status: incident.status,
				impact: incident.impact,
				createdAt: incident.createdAt.toISOString(),
				resolvedAt: incident.resolvedAt?.toISOString() ?? null,
				updates: updates.map((u) => ({
					id: u.id,
					status: u.status,
					message: u.message,
					createdAt: u.createdAt.toISOString(),
				})),
			}
		}),
	)

	const formatMaintenance = (m: (typeof activeMaintenance)[0]) => ({
		id: m.id,
		title: m.title,
		description: m.description,
		startsAt: m.startsAt.toISOString(),
		endsAt: m.endsAt.toISOString(),
	})

	return {
		project: {
			name: project.name,
			slug: project.slug,
			statusPageTitle: project.statusPageTitle,
			statusPageLogoUrl: project.statusPageLogoUrl,
		},
		checks: checksWithUptime,
		activeIncidents: incidentsWithUpdates,
		activeMaintenance: activeMaintenance.map(formatMaintenance),
		upcomingMaintenance: upcomingMaintenance.map(formatMaintenance),
	}
}

const getStatusPageRoute = createRoute({
	method: "get",
	path: "/status/{slug}",
	tags: ["Status"],
	summary: "Get public status page",
	description: "Get public status page data for a project",
	request: {
		params: statusProjectSlugParamSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: statusPageResponseSchema,
				},
			},
			description: "Status page data",
		},
		404: {
			content: {
				"application/json": {
					schema: statusErrorSchema,
				},
			},
			description: "Project not found or status page disabled",
		},
	},
})

const getStatusByDomainRoute = createRoute({
	method: "get",
	path: "/status",
	tags: ["Status"],
	summary: "Get public status page by custom domain",
	description: "Get public status page data for a project by custom domain",
	request: {
		query: statusDomainQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: statusPageResponseSchema,
				},
			},
			description: "Status page data",
		},
		404: {
			content: {
				"application/json": {
					schema: statusErrorSchema,
				},
			},
			description: "Project not found or status page disabled",
		},
	},
})

statusRoutes.openapi(getStatusPageRoute, async (c) => {
	const { slug } = c.req.valid("param")

	const project = await projectRepository.findBySlug(slug)

	if (!project || !project.statusPageEnabled) {
		return c.json({ error: "Status page not found" }, 404)
	}

	const response = await buildStatusPageResponse(project)
	return c.json(response, 200)
})

statusRoutes.openapi(getStatusByDomainRoute, async (c) => {
	const { domain } = c.req.valid("query")

	const project = await projectRepository.findByCustomDomain(domain)

	if (!project || !project.statusPageEnabled || !project.domainVerified) {
		return c.json({ error: "Status page not found" }, 404)
	}

	const response = await buildStatusPageResponse(project)
	return c.json(response, 200)
})
