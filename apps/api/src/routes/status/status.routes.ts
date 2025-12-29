import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import type { AppEnv } from "../../app.js"
import { statusPageService } from "../../services/status-page.service.js"

const statusRoutes = new OpenAPIHono<AppEnv>()

const componentStatusSchema = z.enum([
	"operational",
	"degraded",
	"partial_outage",
	"major_outage",
])

const incidentStatusSchema = z.enum([
	"INVESTIGATING",
	"IDENTIFIED",
	"MONITORING",
	"RESOLVED",
])

const incidentSeveritySchema = z.enum(["MINOR", "MAJOR", "CRITICAL"])

const maintenanceStatusSchema = z.enum([
	"SCHEDULED",
	"IN_PROGRESS",
	"COMPLETED",
])

const uptimeDaySchema = z.object({
	date: z.string(),
	upPercent: z.number(),
})

const publicComponentSchema = z.object({
	id: z.string(),
	displayName: z.string(),
	groupName: z.string().nullable(),
	status: componentStatusSchema,
	lastCheckedAt: z.string().nullable(),
	uptimeHistory: z.array(uptimeDaySchema),
})

const incidentUpdateSchema = z.object({
	id: z.string(),
	status: incidentStatusSchema,
	message: z.string(),
	createdAt: z.string(),
})

const publicIncidentSchema = z.object({
	id: z.string(),
	title: z.string(),
	status: incidentStatusSchema,
	severity: incidentSeveritySchema,
	componentIds: z.array(z.string()),
	startsAt: z.string(),
	resolvedAt: z.string().nullable(),
	updates: z.array(incidentUpdateSchema),
})

const publicMaintenanceSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	componentIds: z.array(z.string()),
	scheduledFor: z.string(),
	expectedEnd: z.string(),
	status: maintenanceStatusSchema,
})

const publicStatusPageSchema = z
	.object({
		name: z.string(),
		description: z.string().nullable(),
		logoUrl: z.string().nullable(),
		accentColor: z.string(),
		theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
		overallStatus: componentStatusSchema,
		components: z.array(publicComponentSchema),
		activeIncidents: z.array(publicIncidentSchema),
		recentIncidents: z.array(publicIncidentSchema),
		upcomingMaintenances: z.array(publicMaintenanceSchema),
	})
	.openapi("PublicStatusPage")

const errorResponseSchema = z
	.object({
		code: z.string(),
		message: z.string(),
	})
	.openapi("Error")

// GET /status/:slug - Public status page data
const getStatusBySlugRoute = createRoute({
	method: "get",
	path: "/status/{slug}",
	request: {
		params: z.object({
			slug: z.string().openapi({ param: { name: "slug", in: "path" } }),
		}),
	},
	responses: {
		200: {
			content: { "application/json": { schema: publicStatusPageSchema } },
			description: "Public status page data",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Status page not found",
		},
	},
})

statusRoutes.openapi(getStatusBySlugRoute, async (c) => {
	const { slug } = c.req.valid("param")

	const statusPage = await statusPageService.getPublicStatusPage(slug)
	if (!statusPage) {
		return c.json({ code: "NOT_FOUND", message: "Status page not found" }, 404)
	}

	return c.json(
		{
			...statusPage,
			components: statusPage.components.map((comp) => ({
				...comp,
				lastCheckedAt: comp.lastCheckedAt?.toISOString() ?? null,
			})),
			activeIncidents: statusPage.activeIncidents.map((inc) => ({
				...inc,
				startsAt: inc.startsAt.toISOString(),
				resolvedAt: inc.resolvedAt?.toISOString() ?? null,
				updates: inc.updates.map((u) => ({
					...u,
					createdAt: u.createdAt.toISOString(),
				})),
			})),
			recentIncidents: statusPage.recentIncidents.map((inc) => ({
				...inc,
				startsAt: inc.startsAt.toISOString(),
				resolvedAt: inc.resolvedAt?.toISOString() ?? null,
				updates: inc.updates.map((u) => ({
					...u,
					createdAt: u.createdAt.toISOString(),
				})),
			})),
			upcomingMaintenances: statusPage.upcomingMaintenances.map((m) => ({
				...m,
				scheduledFor: m.scheduledFor.toISOString(),
				expectedEnd: m.expectedEnd.toISOString(),
			})),
		},
		200,
	)
})

// GET /status/domain/:domain - Lookup by custom domain
const getStatusByDomainRoute = createRoute({
	method: "get",
	path: "/status/domain/{domain}",
	request: {
		params: z.object({
			domain: z.string().openapi({ param: { name: "domain", in: "path" } }),
		}),
	},
	responses: {
		200: {
			content: { "application/json": { schema: publicStatusPageSchema } },
			description: "Public status page data",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Status page not found",
		},
	},
})

statusRoutes.openapi(getStatusByDomainRoute, async (c) => {
	const { domain } = c.req.valid("param")

	const statusPage = await statusPageService.getPublicStatusPageByDomain(domain)
	if (!statusPage) {
		return c.json({ code: "NOT_FOUND", message: "Status page not found" }, 404)
	}

	return c.json(
		{
			...statusPage,
			components: statusPage.components.map((comp) => ({
				...comp,
				lastCheckedAt: comp.lastCheckedAt?.toISOString() ?? null,
			})),
			activeIncidents: statusPage.activeIncidents.map((inc) => ({
				...inc,
				startsAt: inc.startsAt.toISOString(),
				resolvedAt: inc.resolvedAt?.toISOString() ?? null,
				updates: inc.updates.map((u) => ({
					...u,
					createdAt: u.createdAt.toISOString(),
				})),
			})),
			recentIncidents: statusPage.recentIncidents.map((inc) => ({
				...inc,
				startsAt: inc.startsAt.toISOString(),
				resolvedAt: inc.resolvedAt?.toISOString() ?? null,
				updates: inc.updates.map((u) => ({
					...u,
					createdAt: u.createdAt.toISOString(),
				})),
			})),
			upcomingMaintenances: statusPage.upcomingMaintenances.map((m) => ({
				...m,
				scheduledFor: m.scheduledFor.toISOString(),
				expectedEnd: m.expectedEnd.toISOString(),
			})),
		},
		200,
	)
})

export { statusRoutes }
