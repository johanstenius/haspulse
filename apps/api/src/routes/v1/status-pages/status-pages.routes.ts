import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import type { Context } from "hono"
import { forbidden, notFound } from "../../../lib/errors.js"
import {
	deleteFile,
	getKeyFromUrl,
	isR2Configured,
	uploadFile,
} from "../../../lib/r2.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import {
	getRequiredOrg,
	isApiKeyAuth,
	requireAuth,
} from "../../../middleware/auth.js"
import { cronJobRepository } from "../../../repositories/cron-job.repository.js"
import { httpMonitorRepository } from "../../../repositories/http-monitor.repository.js"
import { statusPageRepository } from "../../../repositories/status-page.repository.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	type StatusPageComponentModel,
	type StatusPageModel,
	statusPageService,
} from "../../../services/status-page.service.js"
import {
	type ComponentResponse,
	type StatusPageResponse,
	componentResponseSchema,
	componentsListResponseSchema,
	createComponentSchema,
	createStatusPageSchema,
	errorResponseSchema,
	reorderComponentsSchema,
	setCustomDomainResponseSchema,
	setCustomDomainSchema,
	statusPageResponseSchema,
	updateComponentSchema,
	updateStatusPageSchema,
	uploadLogoResponseSchema,
	verifyDomainResponseSchema,
} from "./status-pages.schemas.js"

const statusPageRoutes = new OpenAPIHono<AuthEnv>()
statusPageRoutes.use("*", requireAuth)

const projectIdParamSchema = z.object({
	projectId: z.string().openapi({ param: { name: "projectId", in: "path" } }),
})

const componentIdParamSchema = z.object({
	projectId: z.string().openapi({ param: { name: "projectId", in: "path" } }),
	componentId: z
		.string()
		.openapi({ param: { name: "componentId", in: "path" } }),
})

function toStatusPageResponse(page: StatusPageModel): StatusPageResponse {
	return {
		id: page.id,
		projectId: page.projectId,
		slug: page.slug,
		name: page.name,
		description: page.description,
		logoUrl: page.logoUrl,
		accentColor: page.accentColor,
		theme: page.theme,
		customDomain: page.customDomain,
		domainVerified: page.domainVerified,
		verifyToken: page.verifyToken,
		showUptime: page.showUptime,
		uptimeDays: page.uptimeDays,
		autoIncidents: page.autoIncidents,
		createdAt: page.createdAt.toISOString(),
		updatedAt: page.updatedAt.toISOString(),
	}
}

function toComponentResponse(
	comp: StatusPageComponentModel,
): ComponentResponse {
	return {
		id: comp.id,
		statusPageId: comp.statusPageId,
		cronJobId: comp.cronJobId,
		httpMonitorId: comp.httpMonitorId,
		displayName: comp.displayName,
		groupName: comp.groupName,
		sortOrder: comp.sortOrder,
		createdAt: comp.createdAt.toISOString(),
		updatedAt: comp.updatedAt.toISOString(),
	}
}

async function getAuthorizedProject(c: Context<AuthEnv>, projectId: string) {
	if (isApiKeyAuth(c)) {
		throw forbidden("API key auth not supported for status pages")
	}
	const org = getRequiredOrg(c)
	return getProjectForOrg(projectId, org.id)
}

// GET /v1/projects/:projectId/status-page
const getStatusPageRoute = createRoute({
	method: "get",
	path: "/{projectId}/status-page",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: statusPageResponseSchema } },
			description: "Status page configuration",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(getStatusPageRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	return c.json(toStatusPageResponse(page), 200)
})

// POST /v1/projects/:projectId/status-page
const createStatusPageRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createStatusPageSchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: statusPageResponseSchema } },
			description: "Status page created",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Bad request",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Conflict - slug already exists",
		},
	},
})

statusPageRoutes.openapi(createStatusPageRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	// Check if status page already exists for project
	const existing = await statusPageService.getByProjectId(projectId)
	if (existing) {
		return c.json(
			{ code: "CONFLICT", message: "Status page already exists" },
			409,
		)
	}

	const body = c.req.valid("json")
	try {
		const page = await statusPageService.create({
			projectId,
			...body,
		})
		return c.json(toStatusPageResponse(page), 201)
	} catch (error) {
		if (error instanceof Error && error.message.includes("slug")) {
			return c.json({ code: "CONFLICT", message: error.message }, 409)
		}
		throw error
	}
})

// PATCH /v1/projects/:projectId/status-page
const updateStatusPageRoute = createRoute({
	method: "patch",
	path: "/{projectId}/status-page",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: updateStatusPageSchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: statusPageResponseSchema } },
			description: "Status page updated",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Conflict - slug already exists",
		},
	},
})

statusPageRoutes.openapi(updateStatusPageRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const existing = await statusPageService.getByProjectId(projectId)
	if (!existing) {
		throw notFound("Status page not found")
	}

	const body = c.req.valid("json")
	try {
		const page = await statusPageService.update(existing.id, body)
		return c.json(toStatusPageResponse(page), 200)
	} catch (error) {
		if (error instanceof Error && error.message.includes("slug")) {
			return c.json({ code: "CONFLICT", message: error.message }, 409)
		}
		throw error
	}
})

// DELETE /v1/projects/:projectId/status-page
const deleteStatusPageRoute = createRoute({
	method: "delete",
	path: "/{projectId}/status-page",
	request: { params: projectIdParamSchema },
	responses: {
		204: { description: "Status page deleted" },
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(deleteStatusPageRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const existing = await statusPageService.getByProjectId(projectId)
	if (!existing) {
		throw notFound("Status page not found")
	}

	await statusPageService.delete(existing.id)
	return c.body(null, 204)
})

// GET /v1/projects/:projectId/status-page/components
const listComponentsRoute = createRoute({
	method: "get",
	path: "/{projectId}/status-page/components",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: componentsListResponseSchema } },
			description: "List of components",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Status page not found",
		},
	},
})

statusPageRoutes.openapi(listComponentsRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	const components = await statusPageService.getComponents(page.id)
	return c.json({ components: components.map(toComponentResponse) }, 200)
})

// POST /v1/projects/:projectId/status-page/components
const addComponentRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page/components",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createComponentSchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: componentResponseSchema } },
			description: "Component added",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Bad request",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(addComponentRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	const body = c.req.valid("json")

	// Verify the cron job or http monitor exists and belongs to project
	if (body.cronJobId) {
		const cronJob = await cronJobRepository.findById(body.cronJobId)
		if (!cronJob || cronJob.projectId !== projectId) {
			throw notFound("Cron job not found")
		}
	}
	if (body.httpMonitorId) {
		const httpMonitor = await httpMonitorRepository.findById(body.httpMonitorId)
		if (!httpMonitor || httpMonitor.projectId !== projectId) {
			throw notFound("HTTP monitor not found")
		}
	}

	const comp = await statusPageService.addComponent({
		statusPageId: page.id,
		...body,
	})
	return c.json(toComponentResponse(comp), 201)
})

// PATCH /v1/projects/:projectId/status-page/components/:componentId
const updateComponentRoute = createRoute({
	method: "patch",
	path: "/{projectId}/status-page/components/{componentId}",
	request: {
		params: componentIdParamSchema,
		body: {
			content: { "application/json": { schema: updateComponentSchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: componentResponseSchema } },
			description: "Component updated",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(updateComponentRoute, async (c) => {
	const { projectId, componentId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	const existing = await statusPageRepository.findComponentById(componentId)
	if (!existing || existing.statusPageId !== page.id) {
		throw notFound("Component not found")
	}

	const body = c.req.valid("json")
	const comp = await statusPageService.updateComponent(componentId, body)
	return c.json(toComponentResponse(comp), 200)
})

// DELETE /v1/projects/:projectId/status-page/components/:componentId
const deleteComponentRoute = createRoute({
	method: "delete",
	path: "/{projectId}/status-page/components/{componentId}",
	request: { params: componentIdParamSchema },
	responses: {
		204: { description: "Component deleted" },
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(deleteComponentRoute, async (c) => {
	const { projectId, componentId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	const existing = await statusPageRepository.findComponentById(componentId)
	if (!existing || existing.statusPageId !== page.id) {
		throw notFound("Component not found")
	}

	await statusPageService.removeComponent(componentId)
	return c.body(null, 204)
})

// POST /v1/projects/:projectId/status-page/components/reorder
const reorderComponentsRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page/components/reorder",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: reorderComponentsSchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: componentsListResponseSchema } },
			description: "Components reordered",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(reorderComponentsRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	const { componentIds } = c.req.valid("json")
	await statusPageService.reorderComponents(page.id, componentIds)

	const components = await statusPageService.getComponents(page.id)
	return c.json({ components: components.map(toComponentResponse) }, 200)
})

// POST /v1/projects/:projectId/status-page/domain - Set custom domain
const setCustomDomainRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page/domain",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: setCustomDomainSchema } },
		},
	},
	responses: {
		200: {
			content: {
				"application/json": { schema: setCustomDomainResponseSchema },
			},
			description: "Custom domain set",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(setCustomDomainRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	const { domain } = c.req.valid("json")
	const result = await statusPageService.setCustomDomain(page.id, domain)
	return c.json(result, 200)
})

// POST /v1/projects/:projectId/status-page/domain/verify - Verify custom domain
const verifyDomainRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page/domain/verify",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: verifyDomainResponseSchema } },
			description: "Domain verification result",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(verifyDomainRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	const result = await statusPageService.verifyDomain(page.id)
	return c.json(result, 200)
})

// POST /v1/projects/:projectId/status-page/logo - Upload logo
const uploadLogoRoute = createRoute({
	method: "post",
	path: "/{projectId}/status-page/logo",
	request: {
		params: projectIdParamSchema,
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						file: z.any().openapi({ type: "string", format: "binary" }),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: uploadLogoResponseSchema } },
			description: "Logo uploaded",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Bad request",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(uploadLogoRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	if (!isR2Configured()) {
		return c.json(
			{
				code: "STORAGE_NOT_CONFIGURED",
				message: "File storage not configured",
			},
			400,
		)
	}

	const formData = await c.req.formData()
	const file = formData.get("file")

	if (!file || !(file instanceof File)) {
		return c.json({ code: "BAD_REQUEST", message: "No file provided" }, 400)
	}

	// Validate file type
	const allowedTypes = [
		"image/png",
		"image/jpeg",
		"image/svg+xml",
		"image/webp",
	]
	if (!allowedTypes.includes(file.type)) {
		return c.json(
			{
				code: "BAD_REQUEST",
				message: "Invalid file type. Use PNG, JPG, SVG, or WebP",
			},
			400,
		)
	}

	// Validate file size (max 500KB)
	const maxSize = 500 * 1024
	if (file.size > maxSize) {
		return c.json(
			{ code: "BAD_REQUEST", message: "File too large. Max 500KB" },
			400,
		)
	}

	// Delete old logo if exists
	if (page.logoUrl) {
		const oldKey = getKeyFromUrl(page.logoUrl)
		if (oldKey) {
			try {
				await deleteFile(oldKey)
			} catch {
				// Ignore delete errors
			}
		}
	}

	// Upload new logo
	const ext = file.name.split(".").pop() ?? "png"
	const key = `logos/${page.id}.${ext}`
	const buffer = await file.arrayBuffer()
	const logoUrl = await uploadFile(key, new Uint8Array(buffer), file.type)

	// Update status page with new logo URL
	await statusPageService.update(page.id, { logoUrl })

	return c.json({ logoUrl }, 200)
})

// DELETE /v1/projects/:projectId/status-page/logo - Delete logo
const deleteLogoRoute = createRoute({
	method: "delete",
	path: "/{projectId}/status-page/logo",
	request: { params: projectIdParamSchema },
	responses: {
		204: { description: "Logo deleted" },
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Not found",
		},
	},
})

statusPageRoutes.openapi(deleteLogoRoute, async (c) => {
	const { projectId } = c.req.valid("param")
	await getAuthorizedProject(c, projectId)

	const page = await statusPageService.getByProjectId(projectId)
	if (!page) {
		throw notFound("Status page not found")
	}

	if (page.logoUrl) {
		const key = getKeyFromUrl(page.logoUrl)
		if (key) {
			try {
				await deleteFile(key)
			} catch {
				// Ignore delete errors
			}
		}
		await statusPageService.update(page.id, { logoUrl: null })
	}

	return c.body(null, 204)
})

export { statusPageRoutes }
