import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../../services/check.service.js", () => ({
	listChecksByProject: vi.fn(),
	listChecksByProjectPaginated: vi.fn(),
	createCheck: vi.fn(),
	getCheckById: vi.fn(),
	updateCheck: vi.fn(),
	deleteCheck: vi.fn(),
	pauseCheck: vi.fn(),
	resumeCheck: vi.fn(),
	slugExistsInProject: vi.fn(),
	getCheckChannelIds: vi.fn(),
	setCheckChannelIds: vi.fn(),
}))

vi.mock("../../../services/project.service.js", () => ({
	getProjectForOrg: vi.fn(),
	getProjectById: vi.fn(),
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
	checkCheckLimit: vi.fn(),
}))

vi.mock("../../../repositories/ping.repository.js", () => ({
	pingRepository: {
		findRecentByCheckIds: vi.fn(),
	},
}))

import { createApp } from "../../../app.js"
import { auth } from "../../../lib/auth.js"
import { checkCheckLimit } from "../../../lib/limits.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import { pingRepository } from "../../../repositories/ping.repository.js"
import {
	createCheck,
	getCheckById,
	getCheckChannelIds,
	listChecksByProjectPaginated,
	pauseCheck,
	resumeCheck,
	slugExistsInProject,
} from "../../../services/check.service.js"
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

const mockCheck = {
	id: "check123",
	projectId: "proj123",
	name: "Test Check",
	slug: "test-check",
	scheduleType: "PERIOD" as const,
	scheduleValue: "3600",
	graceSeconds: 300,
	timezone: null,
	status: "NEW" as const,
	lastPingAt: null,
	lastStartedAt: null,
	nextExpectedAt: null,
	lastAlertAt: null,
	alertOnRecovery: true,
	reminderIntervalHours: null,
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

describe("Check Routes", () => {
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
		vi.mocked(getCheckChannelIds).mockResolvedValue([])
		vi.mocked(checkCheckLimit).mockResolvedValue({ allowed: true })
		vi.mocked(pingRepository.findRecentByCheckIds).mockResolvedValue(new Map())
	})

	describe("with session auth", () => {
		describe("GET /v1/projects/:projectId/checks", () => {
			it("returns list of checks", async () => {
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
				vi.mocked(listChecksByProjectPaginated).mockResolvedValue({
					data: [mockCheck],
					total: 1,
				})

				const res = await app.request("/v1/projects/proj123/checks", {
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(200)
				const json = await res.json()
				expect(json.checks).toHaveLength(1)
				expect(json.checks[0].id).toBe("check123")
				expect(json.total).toBe(1)
				expect(json.page).toBe(1)
				expect(json.limit).toBe(20)
			})
		})

		describe("POST /v1/projects/:projectId/checks", () => {
			it("creates a new check", async () => {
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
				vi.mocked(slugExistsInProject).mockResolvedValue(false)
				vi.mocked(createCheck).mockResolvedValue(mockCheck)

				const res = await app.request("/v1/projects/proj123/checks", {
					method: "POST",
					headers: { "Content-Type": "application/json", "X-Org-Id": "org123" },
					body: JSON.stringify({
						name: "Test Check",
						scheduleType: "PERIOD",
						scheduleValue: "3600",
					}),
				})

				expect(res.status).toBe(201)
				const json = await res.json()
				expect(json.id).toBe("check123")
			})
		})

		describe("GET /v1/checks/:id", () => {
			it("returns check details", async () => {
				vi.mocked(getCheckById).mockResolvedValue(mockCheck)
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)

				const res = await app.request("/v1/checks/check123", {
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(200)
				const json = await res.json()
				expect(json.id).toBe("check123")
			})

			it("returns 404 for non-existent check", async () => {
				vi.mocked(getCheckById).mockResolvedValue(null)

				const res = await app.request("/v1/checks/nonexistent", {
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(404)
			})
		})

		describe("POST /v1/checks/:id/pause", () => {
			it("pauses a check", async () => {
				vi.mocked(getCheckById).mockResolvedValue(mockCheck)
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
				vi.mocked(pauseCheck).mockResolvedValue({
					...mockCheck,
					status: "PAUSED" as const,
				})

				const res = await app.request("/v1/checks/check123/pause", {
					method: "POST",
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(200)
				const json = await res.json()
				expect(json.status).toBe("PAUSED")
			})
		})

		describe("POST /v1/checks/:id/resume", () => {
			it("resumes a check", async () => {
				vi.mocked(getCheckById).mockResolvedValue({
					...mockCheck,
					status: "PAUSED" as const,
				})
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
				vi.mocked(resumeCheck).mockResolvedValue({
					...mockCheck,
					status: "NEW" as const,
				})

				const res = await app.request("/v1/checks/check123/resume", {
					method: "POST",
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(200)
				const json = await res.json()
				expect(json.status).toBe("NEW")
			})
		})
	})

	describe("without auth", () => {
		it("returns 401", async () => {
			vi.mocked(auth.api.getSession).mockResolvedValue(null)

			const res = await app.request("/v1/projects/proj123/checks", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(401)
		})
	})
})
