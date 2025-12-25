import type { RequestFn } from "../http.js"
import type {
	CreateIncidentInput,
	CreateIncidentUpdateInput,
	Incident,
	IncidentStatus,
	IncidentUpdate,
	IncidentWithUpdates,
	PaginatedResponse,
	PaginationParams,
	UpdateIncidentInput,
} from "../types.js"

type IncidentListParams = PaginationParams & {
	status?: IncidentStatus
}

type IncidentListResponse = {
	incidents: Incident[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export class IncidentsClient {
	constructor(private readonly request: RequestFn) {}

	async list(
		projectId: string,
		params?: IncidentListParams,
	): Promise<PaginatedResponse<Incident>> {
		const query = new URLSearchParams()
		if (params?.page) query.set("page", String(params.page))
		if (params?.limit) query.set("limit", String(params.limit))
		if (params?.status) query.set("status", params.status)
		const queryStr = query.toString() ? `?${query.toString()}` : ""

		const data = await this.request<IncidentListResponse>(
			"GET",
			`/v1/projects/${projectId}/incidents${queryStr}`,
		)
		return {
			data: data.incidents,
			total: data.total,
			page: data.page,
			limit: data.limit,
			totalPages: data.totalPages,
		}
	}

	async get(
		projectId: string,
		incidentId: string,
	): Promise<IncidentWithUpdates> {
		return this.request<IncidentWithUpdates>(
			"GET",
			`/v1/projects/${projectId}/incidents/${incidentId}`,
		)
	}

	async create(
		projectId: string,
		input: CreateIncidentInput,
	): Promise<IncidentWithUpdates> {
		return this.request<IncidentWithUpdates>(
			"POST",
			`/v1/projects/${projectId}/incidents`,
			input,
		)
	}

	async update(
		projectId: string,
		incidentId: string,
		input: UpdateIncidentInput,
	): Promise<IncidentWithUpdates> {
		return this.request<IncidentWithUpdates>(
			"PATCH",
			`/v1/projects/${projectId}/incidents/${incidentId}`,
			input,
		)
	}

	async delete(projectId: string, incidentId: string): Promise<void> {
		await this.request<void>(
			"DELETE",
			`/v1/projects/${projectId}/incidents/${incidentId}`,
		)
	}

	async addUpdate(
		projectId: string,
		incidentId: string,
		input: CreateIncidentUpdateInput,
	): Promise<IncidentUpdate> {
		return this.request<IncidentUpdate>(
			"POST",
			`/v1/projects/${projectId}/incidents/${incidentId}/updates`,
			input,
		)
	}
}
