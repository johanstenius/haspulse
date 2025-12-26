import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../../services/alert.service.js", () => ({
	getCheckAlertsPaginated: vi.fn(),
	getOrgAlertsPaginated: vi.fn(),
}))

vi.mock("../../../services/check.service.js", () => ({
	getCheckById: vi.fn(),
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

import { createApp } from "../../../app.js"
import { auth } from "../../../lib/auth.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import {
	getCheckAlertsPaginated,
	getOrgAlertsPaginated,
} from "../../../services/alert.service.js"
import { getCheckById } from "../../../services/check.service.js"
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
	status: "DOWN" as const,
	lastPingAt: new Date("2025-01-01"),
	lastStartedAt: null,
	nextExpectedAt: null,
	lastAlertAt: null,
	alertOnRecovery: true,
	reminderIntervalHours: null,
	anomalySensitivity: "NORMAL" as const,
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

const mockAlert = {
	id: "alert123",
	checkId: "check123",
	event: "check.down",
	channels: [{ id: "ch1", name: "Email", type: "email" }],
	context: null,
	success: true,
	error: null,
	createdAt: new Date("2025-01-02"),
}

const mockAlertWithCheck = {
	...mockAlert,
	checkName: "Test Check",
	projectId: "proj123",
	projectName: "Test Project",
}

describe("Alert Routes", () => {
	const app = createApp()

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: mockUser,
			session: mockSession,
		})
		vi.mocked(organizationRepository.findById).mockResolvedValue(mockOrg)
		vi.mocked(organizationRepository.getMember).mockResolvedValue(mockMember)
	})

	describe("GET /v1/checks/:checkId/alerts", () => {
		it("returns paginated alerts for a check", async () => {
			vi.mocked(getCheckById).mockResolvedValue(mockCheck)
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(getCheckAlertsPaginated).mockResolvedValue({
				data: [mockAlert],
				total: 1,
				page: 1,
				limit: 20,
				totalPages: 1,
			})

			const res = await app.request("/v1/checks/check123/alerts", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.alerts).toHaveLength(1)
			expect(json.alerts[0].id).toBe("alert123")
			expect(json.alerts[0].event).toBe("check.down")
			expect(json.total).toBe(1)
		})

		it("returns 404 for non-existent check", async () => {
			vi.mocked(getCheckById).mockResolvedValue(null)

			const res = await app.request("/v1/checks/nonexistent/alerts", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(404)
		})

		it("filters by event type", async () => {
			vi.mocked(getCheckById).mockResolvedValue(mockCheck)
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(getCheckAlertsPaginated).mockResolvedValue({
				data: [],
				total: 0,
				page: 1,
				limit: 20,
				totalPages: 0,
			})

			const res = await app.request(
				"/v1/checks/check123/alerts?event=check.up",
				{ headers: { "X-Org-Id": "org123" } },
			)

			expect(res.status).toBe(200)
			expect(getCheckAlertsPaginated).toHaveBeenCalledWith(
				"check123",
				1,
				20,
				expect.objectContaining({ event: "check.up" }),
			)
		})
	})

	describe("GET /v1/alerts", () => {
		it("returns paginated alerts across org", async () => {
			vi.mocked(getOrgAlertsPaginated).mockResolvedValue({
				data: [mockAlertWithCheck],
				total: 1,
				page: 1,
				limit: 20,
				totalPages: 1,
			})

			const res = await app.request("/v1/alerts", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.alerts).toHaveLength(1)
			expect(json.alerts[0].checkName).toBe("Test Check")
			expect(json.alerts[0].projectName).toBe("Test Project")
		})

		it("filters by project and check", async () => {
			vi.mocked(getOrgAlertsPaginated).mockResolvedValue({
				data: [],
				total: 0,
				page: 1,
				limit: 20,
				totalPages: 0,
			})

			const res = await app.request(
				"/v1/alerts?projectId=proj123&checkId=check123",
				{ headers: { "X-Org-Id": "org123" } },
			)

			expect(res.status).toBe(200)
			expect(getOrgAlertsPaginated).toHaveBeenCalledWith(
				"org123",
				1,
				20,
				expect.objectContaining({
					projectId: "proj123",
					checkId: "check123",
				}),
			)
		})
	})

	describe("without auth", () => {
		it("returns 401", async () => {
			vi.mocked(auth.api.getSession).mockResolvedValue(null)

			const res = await app.request("/v1/checks/check123/alerts", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(401)
		})
	})
})
