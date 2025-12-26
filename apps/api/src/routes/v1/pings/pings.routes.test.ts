import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"

vi.mock("../../../services/ping.service.js", () => ({
	listPingsByCheck: vi.fn(),
	resolveCheckId: vi.fn(),
	recordPing: vi.fn(),
}))

vi.mock("../../../services/check.service.js", () => ({
	getCheckById: vi.fn(),
}))

vi.mock("../../../services/project.service.js", () => ({
	getProjectForOrg: vi.fn(),
	getProjectById: vi.fn(),
}))

vi.mock("../../../services/api-key.service.js", () => ({
	validateApiKey: vi.fn(),
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

import { auth } from "../../../lib/auth.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import { validateApiKey } from "../../../services/api-key.service.js"
import { getCheckById } from "../../../services/check.service.js"
import { getEffectivePlan } from "../../../services/organization.service.js"
import { listPingsByCheck } from "../../../services/ping.service.js"
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

const mockCheck = {
	id: "check123",
	projectId: "proj123",
	name: "Test Check",
	slug: "test-check",
	scheduleType: "PERIOD" as const,
	scheduleValue: "3600",
	graceSeconds: 300,
	timezone: null,
	status: "UP" as const,
	lastPingAt: new Date("2025-01-01T12:00:00Z"),
	lastStartedAt: null,
	nextExpectedAt: null,
	lastAlertAt: null,
	alertOnRecovery: true,
	reminderIntervalHours: null,
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

const mockPing = {
	id: "ping123",
	checkId: "check123",
	type: "SUCCESS" as const,
	body: null,
	sourceIp: "127.0.0.1",
	createdAt: new Date("2025-01-01T12:00:00Z"),
}

describe("Ping History Routes", () => {
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
	})

	describe("with session auth", () => {
		describe("GET /v1/checks/:id/pings", () => {
			it("returns list of pings", async () => {
				vi.mocked(getCheckById).mockResolvedValue(mockCheck)
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
				vi.mocked(listPingsByCheck).mockResolvedValue([mockPing])

				const res = await app.request("/v1/checks/check123/pings", {
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(200)
				const json = await res.json()
				expect(json.pings).toHaveLength(1)
				expect(json.pings[0].type).toBe("SUCCESS")
			})

			it("returns 404 for non-existent check", async () => {
				vi.mocked(getCheckById).mockResolvedValue(null)

				const res = await app.request("/v1/checks/nonexistent/pings", {
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(404)
			})

			it("respects limit query param", async () => {
				vi.mocked(getCheckById).mockResolvedValue(mockCheck)
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
				vi.mocked(listPingsByCheck).mockResolvedValue([mockPing])

				const res = await app.request("/v1/checks/check123/pings?limit=10", {
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(200)
				expect(listPingsByCheck).toHaveBeenCalledWith("check123", 10)
			})
		})
	})

	describe("with API key auth", () => {
		beforeEach(() => {
			vi.mocked(auth.api.getSession).mockResolvedValue(null)
		})

		describe("GET /v1/checks/:id/pings", () => {
			it("returns pings with valid API key", async () => {
				vi.mocked(validateApiKey).mockResolvedValue({
					id: "apikey123",
					projectId: "proj123",
					name: "Test Key",
					keyPrefix: "hp_live_abc...",
					lastUsedAt: null,
					createdAt: new Date(),
				})
				vi.mocked(getCheckById).mockResolvedValue(mockCheck)
				vi.mocked(listPingsByCheck).mockResolvedValue([mockPing])

				const res = await app.request("/v1/checks/check123/pings", {
					headers: { Authorization: "Bearer hp_live_testkey123" },
				})

				expect(res.status).toBe(200)
				const json = await res.json()
				expect(json.pings).toHaveLength(1)
			})

			it("returns 403 when check belongs to different project", async () => {
				vi.mocked(validateApiKey).mockResolvedValue({
					id: "apikey123",
					projectId: "other-project",
					name: "Test Key",
					keyPrefix: "hp_live_abc...",
					lastUsedAt: null,
					createdAt: new Date(),
				})
				vi.mocked(getCheckById).mockResolvedValue(mockCheck)

				const res = await app.request("/v1/checks/check123/pings", {
					headers: { Authorization: "Bearer hp_live_testkey123" },
				})

				expect(res.status).toBe(403)
			})

			it("returns 401 without auth", async () => {
				const res = await app.request("/v1/checks/check123/pings")

				expect(res.status).toBe(401)
			})
		})
	})
})
