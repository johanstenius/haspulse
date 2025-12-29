import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { getTier } from "../../../lib/tiers.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import {
	createBillingPortalSession,
	createCheckoutSession,
} from "../../../services/billing.service.js"
import { getUsageStats } from "../../../services/organization.service.js"
import {
	type BillingInfoResponse,
	billingInfoResponseSchema,
	checkoutRequestSchema,
	checkoutResponseSchema,
	errorResponseSchema,
	portalRequestSchema,
	portalResponseSchema,
} from "./billing.schemas.js"

const billingRoutes = new OpenAPIHono<AuthEnv>()

billingRoutes.use("*", requireAuth)

const getBillingRoute = createRoute({
	method: "get",
	path: "/",
	responses: {
		200: {
			content: { "application/json": { schema: billingInfoResponseSchema } },
			description: "Current billing info",
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
	tags: ["Billing"],
	summary: "Get current plan and usage",
})

const createCheckoutRoute = createRoute({
	method: "post",
	path: "/checkout",
	request: {
		body: {
			content: { "application/json": { schema: checkoutRequestSchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: checkoutResponseSchema } },
			description: "Checkout session URL",
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
	tags: ["Billing"],
	summary: "Create Stripe checkout session for Pro upgrade",
})

const createPortalRoute = createRoute({
	method: "post",
	path: "/portal",
	request: {
		body: { content: { "application/json": { schema: portalRequestSchema } } },
	},
	responses: {
		200: {
			content: { "application/json": { schema: portalResponseSchema } },
			description: "Billing portal URL",
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
	tags: ["Billing"],
	summary: "Create Stripe billing portal session",
})

billingRoutes.openapi(getBillingRoute, async (c) => {
	const org = getRequiredOrg(c)
	const tier = getTier(org.plan)
	const usage = await getUsageStats(org.id)

	const isTrialing = org.trialEndsAt !== null && org.trialEndsAt > new Date()
	const response: BillingInfoResponse = {
		plan: tier.name,
		displayName: tier.displayName,
		isTrialing,
		trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
		usage: {
			cronJobs: {
				current: usage.totalCronJobs,
				limit:
					tier.limits.cronJobs === Number.POSITIVE_INFINITY
						? null
						: tier.limits.cronJobs,
			},
			httpMonitors: {
				current: usage.totalHttpMonitors,
				limit:
					tier.limits.httpMonitors === Number.POSITIVE_INFINITY
						? null
						: tier.limits.httpMonitors,
			},
			projects: {
				current: usage.projectCount,
				limit:
					tier.limits.projects === Number.POSITIVE_INFINITY
						? null
						: tier.limits.projects,
			},
		},
	}

	return c.json(response, 200)
})

billingRoutes.openapi(createCheckoutRoute, async (c) => {
	const org = getRequiredOrg(c)
	const body = c.req.valid("json")
	const url = await createCheckoutSession(
		org.id,
		body.successUrl,
		body.cancelUrl,
	)
	return c.json({ url }, 200)
})

billingRoutes.openapi(createPortalRoute, async (c) => {
	const org = getRequiredOrg(c)
	const body = c.req.valid("json")
	const url = await createBillingPortalSession(org.id, body.returnUrl)
	return c.json({ url }, 200)
})

export { billingRoutes }
