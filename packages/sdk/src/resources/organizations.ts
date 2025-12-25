import type { RequestFn } from "../http.js"
import type {
	CreateOrganizationInput,
	Organization,
	UpdateOrganizationInput,
} from "../types.js"

export class OrganizationsClient {
	constructor(private readonly request: RequestFn) {}

	async list(): Promise<Organization[]> {
		const data = await this.request<{ organizations: Organization[] }>(
			"GET",
			"/v1/organizations",
		)
		return data.organizations
	}

	async get(id: string): Promise<Organization> {
		return this.request<Organization>("GET", `/v1/organizations/${id}`)
	}

	async create(input: CreateOrganizationInput): Promise<Organization> {
		return this.request<Organization>("POST", "/v1/organizations", input)
	}

	async update(
		id: string,
		input: UpdateOrganizationInput,
	): Promise<Organization> {
		return this.request<Organization>("PATCH", `/v1/organizations/${id}`, input)
	}

	async delete(id: string): Promise<void> {
		await this.request<void>("DELETE", `/v1/organizations/${id}`)
	}
}
