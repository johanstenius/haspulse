import type { RequestFn } from "../http.js"
import type {
	CreateMaintenanceInput,
	Maintenance,
	MaintenanceWithChecks,
	PaginatedResponse,
	PaginationParams,
	UpdateMaintenanceInput,
} from "../types.js"

type MaintenanceListParams = PaginationParams & {
	upcoming?: boolean
}

type MaintenanceListResponse = {
	maintenance: Maintenance[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export class MaintenanceClient {
	constructor(private readonly request: RequestFn) {}

	async list(
		projectId: string,
		params?: MaintenanceListParams,
	): Promise<PaginatedResponse<Maintenance>> {
		const query = new URLSearchParams()
		if (params?.page) query.set("page", String(params.page))
		if (params?.limit) query.set("limit", String(params.limit))
		if (params?.upcoming) query.set("upcoming", "true")
		const queryStr = query.toString() ? `?${query.toString()}` : ""

		const data = await this.request<MaintenanceListResponse>(
			"GET",
			`/v1/projects/${projectId}/maintenance${queryStr}`,
		)
		return {
			data: data.maintenance,
			total: data.total,
			page: data.page,
			limit: data.limit,
			totalPages: data.totalPages,
		}
	}

	async get(
		projectId: string,
		maintenanceId: string,
	): Promise<MaintenanceWithChecks> {
		return this.request<MaintenanceWithChecks>(
			"GET",
			`/v1/projects/${projectId}/maintenance/${maintenanceId}`,
		)
	}

	async create(
		projectId: string,
		input: CreateMaintenanceInput,
	): Promise<MaintenanceWithChecks> {
		return this.request<MaintenanceWithChecks>(
			"POST",
			`/v1/projects/${projectId}/maintenance`,
			input,
		)
	}

	async update(
		projectId: string,
		maintenanceId: string,
		input: UpdateMaintenanceInput,
	): Promise<MaintenanceWithChecks> {
		return this.request<MaintenanceWithChecks>(
			"PATCH",
			`/v1/projects/${projectId}/maintenance/${maintenanceId}`,
			input,
		)
	}

	async delete(projectId: string, maintenanceId: string): Promise<void> {
		await this.request<void>(
			"DELETE",
			`/v1/projects/${projectId}/maintenance/${maintenanceId}`,
		)
	}
}
