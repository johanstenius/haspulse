import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import {
	checkDomainVerification,
	getDomainInstructions,
	removeCustomDomain,
	setCustomDomain,
	verifyAndSaveDomain,
} from "../../../services/domain.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	type DomainResponse,
	domainResponseSchema,
	domainVerifyResponseSchema,
	errorResponseSchema,
	projectIdParamSchema,
	setDomainBodySchema,
} from "./domains.schemas.js"

const domainRoutes = new OpenAPIHono<AuthEnv>()

domainRoutes.use("*", requireAuth)

function toDomainResponse(
	domain: string | null,
	verified: boolean,
	verifyToken: string | null,
): DomainResponse {
	return {
		domain,
		verified,
		instructions:
			domain && verifyToken ? getDomainInstructions(domain, verifyToken) : null,
	}
}

const getDomainRoute = createRoute({
	method: "get",
	path: "/{projectId}/domain",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: domainResponseSchema } },
			description: "Current domain configuration",
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
	tags: ["Domains"],
	summary: "Get custom domain configuration",
})

const setDomainRoute = createRoute({
	method: "post",
	path: "/{projectId}/domain",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: setDomainBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: domainResponseSchema } },
			description: "Domain set, pending verification",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Invalid domain",
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
			description: "Domain already in use",
		},
	},
	tags: ["Domains"],
	summary: "Set custom domain for status page",
})

const verifyDomainRoute = createRoute({
	method: "post",
	path: "/{projectId}/domain/verify",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: domainVerifyResponseSchema } },
			description: "Verification result",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "No domain configured",
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
	tags: ["Domains"],
	summary: "Verify custom domain DNS configuration",
})

const deleteDomainRoute = createRoute({
	method: "delete",
	path: "/{projectId}/domain",
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: domainResponseSchema } },
			description: "Domain removed",
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
	tags: ["Domains"],
	summary: "Remove custom domain",
})

domainRoutes.openapi(getDomainRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const project = await getProjectForOrg(projectId, org.id)

	return c.json(
		toDomainResponse(
			project.customDomain,
			project.domainVerified,
			project.domainVerifyToken,
		),
		200,
	)
})

domainRoutes.openapi(setDomainRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const { domain } = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const updated = await setCustomDomain(projectId, domain)

	return c.json(
		toDomainResponse(
			updated.customDomain,
			updated.domainVerified,
			updated.domainVerifyToken,
		),
		200,
	)
})

domainRoutes.openapi(verifyDomainRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const project = await getProjectForOrg(projectId, org.id)

	const result = await checkDomainVerification(project)

	if (result.verified) {
		await verifyAndSaveDomain(project)
	}

	return c.json(result, 200)
})

domainRoutes.openapi(deleteDomainRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)

	const updated = await removeCustomDomain(projectId)

	return c.json(
		toDomainResponse(
			updated.customDomain,
			updated.domainVerified,
			updated.domainVerifyToken,
		),
		200,
	)
})

export { domainRoutes }
