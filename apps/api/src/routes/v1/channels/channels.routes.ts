import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { limitExceeded, notFound } from "../../../lib/errors.js"
import { checkChannelLimit } from "../../../lib/limits.js"
import { toChannelResponse } from "../../../lib/mappers.js"
import type { AuthEnv } from "../../../middleware/auth.js"
import { getRequiredOrg, requireAuth } from "../../../middleware/auth.js"
import { testChannel } from "../../../services/channel-sender.service.js"
import {
	createChannel,
	deleteChannel,
	getChannelById,
	listChannelsByProjectPaginated,
	updateChannel,
} from "../../../services/channel.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"
import {
	channelIdParamSchema,
	channelListResponseSchema,
	channelResponseSchema,
	createChannelBodySchema,
	errorResponseSchema,
	paginationQuerySchema,
	projectIdParamSchema,
	testChannelResponseSchema,
	updateChannelBodySchema,
} from "./channels.schemas.js"

const channelRoutes = new OpenAPIHono<AuthEnv>()

channelRoutes.use("*", requireAuth)

const listChannelsRoute = createRoute({
	method: "get",
	path: "/{projectId}/channels",
	request: { params: projectIdParamSchema, query: paginationQuerySchema },
	responses: {
		200: {
			content: { "application/json": { schema: channelListResponseSchema } },
			description: "Paginated list of channels",
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
	tags: ["Channels"],
	summary: "List all channels for a project",
})

const createChannelRoute = createRoute({
	method: "post",
	path: "/{projectId}/channels",
	request: {
		params: projectIdParamSchema,
		body: {
			content: { "application/json": { schema: createChannelBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: channelResponseSchema } },
			description: "Channel created",
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
	tags: ["Channels"],
	summary: "Create a new channel",
})

const getChannelRoute = createRoute({
	method: "get",
	path: "/{projectId}/channels/{channelId}",
	request: { params: channelIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: channelResponseSchema } },
			description: "Channel details",
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
			description: "Channel not found",
		},
	},
	tags: ["Channels"],
	summary: "Get channel by ID",
})

const updateChannelRoute = createRoute({
	method: "patch",
	path: "/{projectId}/channels/{channelId}",
	request: {
		params: channelIdParamSchema,
		body: {
			content: { "application/json": { schema: updateChannelBodySchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: channelResponseSchema } },
			description: "Channel updated",
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
			description: "Channel not found",
		},
	},
	tags: ["Channels"],
	summary: "Update channel",
})

const deleteChannelRoute = createRoute({
	method: "delete",
	path: "/{projectId}/channels/{channelId}",
	request: { params: channelIdParamSchema },
	responses: {
		204: { description: "Channel deleted" },
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
			description: "Channel not found",
		},
	},
	tags: ["Channels"],
	summary: "Delete channel",
})

const testChannelRoute = createRoute({
	method: "post",
	path: "/{projectId}/channels/{channelId}/test",
	request: { params: channelIdParamSchema },
	responses: {
		200: {
			content: { "application/json": { schema: testChannelResponseSchema } },
			description: "Test result",
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
			description: "Channel not found",
		},
	},
	tags: ["Channels"],
	summary: "Send a test notification to a channel",
})

channelRoutes.openapi(listChannelsRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const { page, limit } = c.req.valid("query")
	await getProjectForOrg(projectId, org.id)
	const { data, total } = await listChannelsByProjectPaginated(
		projectId,
		page,
		limit,
	)
	return c.json(
		{
			channels: data.map(toChannelResponse),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
		200,
	)
})

channelRoutes.openapi(createChannelRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId } = c.req.valid("param")
	const body = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const limitCheck = await checkChannelLimit(projectId, org.plan)
	if (!limitCheck.allowed) {
		throw limitExceeded(
			limitCheck.resource,
			limitCheck.limit,
			limitCheck.current,
		)
	}

	const channel = await createChannel({
		projectId,
		type: body.type,
		name: body.name,
		config: body.config,
		isDefault: body.isDefault,
	})

	return c.json(toChannelResponse(channel), 201)
})

channelRoutes.openapi(getChannelRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, channelId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)

	const channel = await getChannelById(channelId)
	if (!channel || channel.projectId !== projectId) {
		throw notFound("Channel not found")
	}

	return c.json(toChannelResponse(channel), 200)
})

channelRoutes.openapi(updateChannelRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, channelId } = c.req.valid("param")
	const body = c.req.valid("json")
	await getProjectForOrg(projectId, org.id)

	const channel = await getChannelById(channelId)
	if (!channel || channel.projectId !== projectId) {
		throw notFound("Channel not found")
	}

	const updated = await updateChannel(channelId, body)
	return c.json(toChannelResponse(updated), 200)
})

channelRoutes.openapi(deleteChannelRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, channelId } = c.req.valid("param")
	await getProjectForOrg(projectId, org.id)

	const channel = await getChannelById(channelId)
	if (!channel || channel.projectId !== projectId) {
		throw notFound("Channel not found")
	}

	await deleteChannel(channelId)
	return c.body(null, 204)
})

channelRoutes.openapi(testChannelRoute, async (c) => {
	const org = getRequiredOrg(c)
	const { projectId, channelId } = c.req.valid("param")
	const project = await getProjectForOrg(projectId, org.id)

	const channel = await getChannelById(channelId)
	if (!channel || channel.projectId !== projectId) {
		throw notFound("Channel not found")
	}

	const result = await testChannel(channel, project)
	return c.json(result, 200)
})

export { channelRoutes }
