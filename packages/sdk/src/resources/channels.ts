import type { RequestFn } from "../http.js"
import type {
	Channel,
	CreateChannelInput,
	PaginatedResponse,
	PaginationParams,
	UpdateChannelInput,
} from "../types.js"

type ChannelListResponse = {
	channels: Channel[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export class ChannelsClient {
	constructor(private readonly request: RequestFn) {}

	async list(
		projectId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<Channel>> {
		const query = new URLSearchParams()
		if (params?.page) query.set("page", String(params.page))
		if (params?.limit) query.set("limit", String(params.limit))
		const queryStr = query.toString() ? `?${query.toString()}` : ""

		const data = await this.request<ChannelListResponse>(
			"GET",
			`/v1/projects/${projectId}/channels${queryStr}`,
		)
		return {
			data: data.channels,
			total: data.total,
			page: data.page,
			limit: data.limit,
			totalPages: data.totalPages,
		}
	}

	async get(projectId: string, channelId: string): Promise<Channel> {
		return this.request<Channel>(
			"GET",
			`/v1/projects/${projectId}/channels/${channelId}`,
		)
	}

	async create(projectId: string, input: CreateChannelInput): Promise<Channel> {
		return this.request<Channel>(
			"POST",
			`/v1/projects/${projectId}/channels`,
			input,
		)
	}

	async update(
		projectId: string,
		channelId: string,
		input: UpdateChannelInput,
	): Promise<Channel> {
		return this.request<Channel>(
			"PATCH",
			`/v1/projects/${projectId}/channels/${channelId}`,
			input,
		)
	}

	async delete(projectId: string, channelId: string): Promise<void> {
		await this.request<void>(
			"DELETE",
			`/v1/projects/${projectId}/channels/${channelId}`,
		)
	}

	async test(
		projectId: string,
		channelId: string,
	): Promise<{ success: boolean; error?: string }> {
		return this.request<{ success: boolean; error?: string }>(
			"POST",
			`/v1/projects/${projectId}/channels/${channelId}/test`,
		)
	}
}
