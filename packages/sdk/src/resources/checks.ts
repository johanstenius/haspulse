import type { RequestFn } from "../http.js"
import type {
	Check,
	CheckStats,
	CreateCheckInput,
	PaginatedResponse,
	PaginationParams,
	UpdateCheckInput,
} from "../types.js"

type CheckListResponse = {
	checks: Check[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export class ChecksClient {
	constructor(private readonly request: RequestFn) {}

	async list(
		projectId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<Check>> {
		const query = new URLSearchParams()
		if (params?.page) query.set("page", String(params.page))
		if (params?.limit) query.set("limit", String(params.limit))
		const queryStr = query.toString() ? `?${query.toString()}` : ""

		const data = await this.request<CheckListResponse>(
			"GET",
			`/v1/projects/${projectId}/checks${queryStr}`,
		)
		return {
			data: data.checks,
			total: data.total,
			page: data.page,
			limit: data.limit,
			totalPages: data.totalPages,
		}
	}

	async get(id: string): Promise<Check> {
		return this.request<Check>("GET", `/v1/checks/${id}`)
	}

	async create(projectId: string, input: CreateCheckInput): Promise<Check> {
		return this.request<Check>(
			"POST",
			`/v1/projects/${projectId}/checks`,
			input,
		)
	}

	async update(id: string, input: UpdateCheckInput): Promise<Check> {
		return this.request<Check>("PATCH", `/v1/checks/${id}`, input)
	}

	async delete(id: string): Promise<void> {
		await this.request<void>("DELETE", `/v1/checks/${id}`)
	}

	async pause(id: string): Promise<Check> {
		return this.request<Check>("POST", `/v1/checks/${id}/pause`)
	}

	async resume(id: string): Promise<Check> {
		return this.request<Check>("POST", `/v1/checks/${id}/resume`)
	}

	async stats(id: string, days = 90): Promise<CheckStats> {
		return this.request<CheckStats>(
			"GET",
			`/v1/checks/${id}/stats?days=${days}`,
		)
	}
}
