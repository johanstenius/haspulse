import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"

vi.mock("../../../services/project.service.js", () => ({
	listProjectsByOrg: vi.fn(),
	listProjectsByOrgPaginated: vi.fn(),
	createProject: vi.fn(),
	getProjectForOrg: vi.fn(),
	updateProject: vi.fn(),
	deleteProject: vi.fn(),
	slugExists: vi.fn(),
	generateUniqueSlug: vi.fn(),
}))

vi.mock("../../../lib/auth.js", () => ({
	auth: {
		handler: vi.fn(),
		api: {
			getSession: vi.fn(),
		},
	},
}))

vi.mock("../../../repositories/organization.repository.js", () => ({
	organizationRepository: {
		findById: vi.fn(),
		getMember: vi.fn(),
	},
}))

vi.mock("../../../services/organization.service.js", () => ({
	getEffectivePlan: vi.fn(),
}))

vi.mock("../../../lib/limits.js", () => ({
	checkProjectLimit: vi.fn(),
}))

import { auth } from "../../../lib/auth.js"
import { checkProjectLimit } from "../../../lib/limits.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import { getEffectivePlan } from "../../../services/organization.service.js"
import {
	createProject,
	deleteProject,
	generateUniqueSlug,
	getProjectForOrg,
	listProjectsByOrgPaginated,
	slugExists,
	updateProject,
} from "../../../services/project.service.js"

const mockUser = {
	id: "user123",
	email: "test@example.com",
	name: "Test User",
	emailVerified: true,
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}
const mockSession = {
	id: "session123",
	userId: "user123",
	token: "token123",
	expiresAt: new Date("2026-01-01"),
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

const mockOrg = {
	id: "org123",
	name: "Test Org",
	slug: "test-org",
	plan: "free",
	stripeCustomerId: null,
	stripeSubscriptionId: null,
	trialEndsAt: null,
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

const mockMember = {
	id: "member123",
	userId: "user123",
	orgId: "org123",
	role: "owner",
	createdAt: new Date("2025-01-01"),
}

const mockProject = {
	id: "proj123",
	orgId: "org123",
	name: "Test Project",
	slug: "test-project",
	timezone: "UTC",
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

describe("Project Routes", () => {
	const app = createApp()

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: mockUser,
			session: mockSession,
		})
		vi.mocked(organizationRepository.findById).mockResolvedValue(mockOrg)
		vi.mocked(organizationRepository.getMember).mockResolvedValue(mockMember)
		vi.mocked(getEffectivePlan).mockResolvedValue("free")
		vi.mocked(checkProjectLimit).mockResolvedValue({ allowed: true })
	})

	describe("GET /v1/projects", () => {
		it("returns list of projects for organization", async () => {
			vi.mocked(listProjectsByOrgPaginated).mockResolvedValue({
				data: [mockProject],
				total: 1,
			})

			const res = await app.request("/v1/projects", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.projects).toHaveLength(1)
			expect(json.projects[0].id).toBe("proj123")
			expect(json.total).toBe(1)
			expect(json.page).toBe(1)
			expect(json.limit).toBe(20)
		})

		it("returns 401 when not authenticated", async () => {
			vi.mocked(auth.api.getSession).mockResolvedValue(null)

			const res = await app.request("/v1/projects", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(401)
		})

		it("returns 403 when X-Org-Id header missing", async () => {
			const res = await app.request("/v1/projects")

			expect(res.status).toBe(403)
		})
	})

	describe("POST /v1/projects", () => {
		it("creates a new project", async () => {
			vi.mocked(generateUniqueSlug).mockResolvedValue("test-project")
			vi.mocked(createProject).mockResolvedValue(mockProject)

			const res = await app.request("/v1/projects", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Org-Id": "org123" },
				body: JSON.stringify({ name: "Test Project", slug: "test-project" }),
			})

			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.id).toBe("proj123")
		})

		it("auto-generates unique slug when slug exists", async () => {
			vi.mocked(generateUniqueSlug).mockResolvedValue("existing-slug-2")
			vi.mocked(createProject).mockResolvedValue({
				...mockProject,
				slug: "existing-slug-2",
			})

			const res = await app.request("/v1/projects", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Org-Id": "org123" },
				body: JSON.stringify({ name: "Test Project", slug: "existing-slug" }),
			})

			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.slug).toBe("existing-slug-2")
		})
	})

	describe("GET /v1/projects/:id", () => {
		it("returns project details", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)

			const res = await app.request("/v1/projects/proj123", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.id).toBe("proj123")
		})
	})

	describe("PATCH /v1/projects/:id", () => {
		it("updates project", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(slugExists).mockResolvedValue(false)
			vi.mocked(updateProject).mockResolvedValue({
				...mockProject,
				name: "Updated Name",
			})

			const res = await app.request("/v1/projects/proj123", {
				method: "PATCH",
				headers: { "Content-Type": "application/json", "X-Org-Id": "org123" },
				body: JSON.stringify({ name: "Updated Name" }),
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.name).toBe("Updated Name")
		})
	})

	describe("DELETE /v1/projects/:id", () => {
		it("deletes project", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(deleteProject).mockResolvedValue(undefined)

			const res = await app.request("/v1/projects/proj123", {
				method: "DELETE",
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(204)
		})
	})
})
