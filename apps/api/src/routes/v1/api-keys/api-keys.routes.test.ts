import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"

vi.mock("../../../services/api-key.service.js", () => ({
	listApiKeys: vi.fn(),
	createApiKey: vi.fn(),
	getApiKeyById: vi.fn(),
	deleteApiKey: vi.fn(),
	validateApiKey: vi.fn(),
}))

vi.mock("../../../services/project.service.js", () => ({
	getProjectForOrg: vi.fn(),
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
	checkApiKeyLimit: vi.fn(),
}))

import { auth } from "../../../lib/auth.js"
import { checkApiKeyLimit } from "../../../lib/limits.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import {
	createApiKey,
	deleteApiKey,
	getApiKeyById,
	listApiKeys,
} from "../../../services/api-key.service.js"
import { getEffectivePlan } from "../../../services/organization.service.js"
import { getProjectForOrg } from "../../../services/project.service.js"

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

const mockApiKey = {
	id: "apikey123",
	projectId: "proj123",
	name: "Production Key",
	keyPrefix: "hp_live_abc...",
	lastUsedAt: null,
	createdAt: new Date("2025-01-01"),
}

describe("API Key Routes", () => {
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
		vi.mocked(checkApiKeyLimit).mockResolvedValue({ allowed: true })
	})

	describe("GET /v1/projects/:projectId/api-keys", () => {
		it("returns list of API keys", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(listApiKeys).mockResolvedValue([mockApiKey])

			const res = await app.request("/v1/projects/proj123/api-keys", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.apiKeys).toHaveLength(1)
			expect(json.apiKeys[0].keyPrefix).toBe("hp_live_abc...")
		})

		it("returns 401 when not authenticated", async () => {
			vi.mocked(auth.api.getSession).mockResolvedValue(null)

			const res = await app.request("/v1/projects/proj123/api-keys", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(401)
		})
	})

	describe("POST /v1/projects/:projectId/api-keys", () => {
		it("creates a new API key and returns full key", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(createApiKey).mockResolvedValue({
				apiKey: mockApiKey,
				fullKey: "hp_live_abcdef123456",
			})

			const res = await app.request("/v1/projects/proj123/api-keys", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Org-Id": "org123" },
				body: JSON.stringify({ name: "Production Key" }),
			})

			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.fullKey).toBe("hp_live_abcdef123456")
			expect(json.apiKey.id).toBe("apikey123")
		})
	})

	describe("DELETE /v1/projects/:projectId/api-keys/:apiKeyId", () => {
		it("deletes API key", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(getApiKeyById).mockResolvedValue(mockApiKey)
			vi.mocked(deleteApiKey).mockResolvedValue(undefined)

			const res = await app.request("/v1/projects/proj123/api-keys/apikey123", {
				method: "DELETE",
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(204)
		})

		it("returns 404 for API key in different project", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(getApiKeyById).mockResolvedValue({
				...mockApiKey,
				projectId: "other-project",
			})

			const res = await app.request("/v1/projects/proj123/api-keys/apikey123", {
				method: "DELETE",
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(404)
		})
	})
})
