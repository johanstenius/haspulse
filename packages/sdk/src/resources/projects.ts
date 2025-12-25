import type { RequestFn } from "../http.js"
import type {
	CreateProjectInput,
	PaginatedResponse,
	PaginationParams,
	Project,
	UpdateProjectInput,
} from "../types.js"

type ProjectListResponse = {
	projects: Project[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export class ProjectsClient {
	constructor(private readonly request: RequestFn) {}

	async list(params?: PaginationParams): Promise<PaginatedResponse<Project>> {
		const query = new URLSearchParams()
		if (params?.page) query.set("page", String(params.page))
		if (params?.limit) query.set("limit", String(params.limit))
		const queryStr = query.toString() ? `?${query.toString()}` : ""

		const data = await this.request<ProjectListResponse>(
			"GET",
			`/v1/projects${queryStr}`,
		)
		return {
			data: data.projects,
			total: data.total,
			page: data.page,
			limit: data.limit,
			totalPages: data.totalPages,
		}
	}

	async get(id: string): Promise<Project> {
		return this.request<Project>("GET", `/v1/projects/${id}`)
	}

	async create(input: CreateProjectInput): Promise<Project> {
		return this.request<Project>("POST", "/v1/projects", input)
	}

	async update(id: string, input: UpdateProjectInput): Promise<Project> {
		return this.request<Project>("PATCH", `/v1/projects/${id}`, input)
	}

	async delete(id: string): Promise<void> {
		await this.request<void>("DELETE", `/v1/projects/${id}`)
	}
}
