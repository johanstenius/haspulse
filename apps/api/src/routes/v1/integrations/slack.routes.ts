import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { config } from "../../../env.js"
import { badRequest } from "../../../lib/errors.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import { createChannel } from "../../../services/channel.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import { errorResponseSchema } from "../shared/schemas.js"

const slackRoutes = new OpenAPIHono<AuthEnv>()

const authorizeQuerySchema = z.object({
	projectId: z
		.string()
		.min(1)
		.openapi({
			param: { name: "projectId", in: "query" },
			example: "V1StGXR8_Z5jdHi6",
		}),
	channelName: z
		.string()
		.optional()
		.openapi({
			param: { name: "channelName", in: "query" },
			example: "My Slack Channel",
		}),
})

const authorizeResponseSchema = z
	.object({
		url: z.string(),
	})
	.openapi("SlackAuthorizeResponse")

const callbackQuerySchema = z.object({
	code: z.string().openapi({
		param: { name: "code", in: "query" },
	}),
	state: z.string().openapi({
		param: { name: "state", in: "query" },
	}),
})

const authorizeRoute = createRoute({
	method: "get",
	path: "/authorize",
	request: {
		query: authorizeQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: authorizeResponseSchema } },
			description: "Slack OAuth URL",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Slack not configured",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "Unauthorized",
		},
	},
	tags: ["Integrations"],
	summary: "Get Slack OAuth URL",
})

const callbackRoute = createRoute({
	method: "get",
	path: "/callback",
	request: {
		query: callbackQuerySchema,
	},
	responses: {
		302: { description: "Redirect to dashboard" },
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "OAuth failed",
		},
	},
	tags: ["Integrations"],
	summary: "Slack OAuth callback",
})

slackRoutes.use("/authorize", requireAuth)

slackRoutes.openapi(authorizeRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, channelName } = c.req.valid("query")

	if (!config.slackClientId || !config.slackClientSecret) {
		throw badRequest("Slack integration not configured")
	}

	await getProjectForOrg(projectId, org.id)

	const state = Buffer.from(
		JSON.stringify({ projectId, channelName, orgId: org.id }),
	).toString("base64")
	const scopes = "incoming-webhook"
	const redirectUri = `${config.appUrl}/api/v1/integrations/slack/callback`

	const url = `https://slack.com/oauth/v2/authorize?client_id=${config.slackClientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

	return c.json({ url }, 200)
})

type SlackOAuthResponse = {
	ok: boolean
	error?: string
	access_token?: string
	team?: { id: string; name: string }
	incoming_webhook?: {
		channel: string
		channel_id: string
		url: string
	}
}

slackRoutes.openapi(callbackRoute, async (c) => {
	const { code, state } = c.req.valid("query")

	if (!config.slackClientId || !config.slackClientSecret) {
		return c.redirect(`${config.appUrl}/projects?error=slack_not_configured`)
	}

	let stateData: { projectId: string; channelName?: string; orgId: string }
	try {
		stateData = JSON.parse(Buffer.from(state, "base64").toString())
	} catch {
		return c.redirect(`${config.appUrl}/projects?error=invalid_state`)
	}

	const redirectUri = `${config.appUrl}/api/v1/integrations/slack/callback`

	const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: config.slackClientId,
			client_secret: config.slackClientSecret,
			code,
			redirect_uri: redirectUri,
		}),
	})

	const tokenData = (await tokenRes.json()) as SlackOAuthResponse

	if (!tokenData.ok || !tokenData.incoming_webhook) {
		return c.redirect(
			`${config.appUrl}/projects/${stateData.projectId}?error=slack_oauth_failed`,
		)
	}

	await createChannel({
		projectId: stateData.projectId,
		type: "SLACK_APP",
		name:
			stateData.channelName ||
			`Slack #${tokenData.incoming_webhook.channel || "unknown"}`,
		config: {
			accessToken: tokenData.access_token,
			teamId: tokenData.team?.id,
			teamName: tokenData.team?.name,
			channelId: tokenData.incoming_webhook.channel_id,
			channelName: tokenData.incoming_webhook.channel,
			webhookUrl: tokenData.incoming_webhook.url,
		},
	})

	return c.redirect(
		`${config.appUrl}/projects/${stateData.projectId}?success=slack_connected`,
	)
})

export { slackRoutes }
