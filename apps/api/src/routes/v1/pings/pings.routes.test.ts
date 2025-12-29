import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"

vi.mock("../../../services/ping.service.js", () => ({
	listPingsByCronJobPaginated: vi.fn(),
	resolveCheckId: vi.fn(),
	recordPing: vi.fn(),
}))

vi.mock("../../../services/cron-job.service.js", () => ({
	getCronJobById: vi.fn(),
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
import { getCronJobById } from "../../../services/cron-job.service.js"
import { getEffectivePlan } from "../../../services/organization.service.js"
import { listPingsByCronJobPaginated } from "../../../services/ping.service.js"
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
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

const mockCronJob = {
	id: "cronjob123",
	projectId: "proj123",
	name: "Test CronJob",
	slug: "test-cronjob",
	scheduleType: "PERIOD" as const,
	scheduleValue: "3600",
	graceSeconds: 300,
	status: "UP" as const,
	lastPingAt: new Date("2025-01-01T12:00:00Z"),
	lastStartedAt: null,
	nextExpectedAt: null,
	lastAlertAt: null,
	alertOnRecovery: true,
	reminderIntervalHours: null,
	anomalySensitivity: "NORMAL" as const,
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

const mockPing = {
	id: "ping123",
	cronJobId: "cronjob123",
	type: "SUCCESS" as const,
	body: null,
	sourceIp: "127.0.0.1",
	durationMs: null,
	startPingId: null,
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
		describe("GET /v1/cron-jobs/:id/pings", () => {
			it("returns list of pings", async () => {
				vi.mocked(getCronJobById).mockResolvedValue(mockCronJob)
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
				vi.mocked(listPingsByCronJobPaginated).mockResolvedValue({
					data: [mockPing],
					total: 1,
					page: 1,
					limit: 20,
					totalPages: 1,
				})

				const res = await app.request("/v1/cron-jobs/cronjob123/pings", {
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(200)
				const json = await res.json()
				expect(json.pings).toHaveLength(1)
				expect(json.pings[0].type).toBe("SUCCESS")
				expect(json.total).toBe(1)
			})

			it("returns 404 for non-existent cron job", async () => {
				vi.mocked(getCronJobById).mockResolvedValue(null)

				const res = await app.request("/v1/cron-jobs/nonexistent/pings", {
					headers: { "X-Org-Id": "org123" },
				})

				expect(res.status).toBe(404)
			})

			it("respects pagination params", async () => {
				vi.mocked(getCronJobById).mockResolvedValue(mockCronJob)
				vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
				vi.mocked(listPingsByCronJobPaginated).mockResolvedValue({
					data: [mockPing],
					total: 50,
					page: 2,
					limit: 10,
					totalPages: 5,
				})

				const res = await app.request(
					"/v1/cron-jobs/cronjob123/pings?page=2&limit=10",
					{ headers: { "X-Org-Id": "org123" } },
				)

				expect(res.status).toBe(200)
				expect(listPingsByCronJobPaginated).toHaveBeenCalledWith(
					"cronjob123",
					2,
					10,
				)
			})
		})
	})

	describe("with API key auth", () => {
		beforeEach(() => {
			vi.mocked(auth.api.getSession).mockResolvedValue(null)
		})

		describe("GET /v1/cron-jobs/:id/pings", () => {
			it("returns pings with valid API key", async () => {
				vi.mocked(validateApiKey).mockResolvedValue({
					id: "apikey123",
					projectId: "proj123",
					name: "Test Key",
					keyPrefix: "hp_live_abc...",
					lastUsedAt: null,
					createdAt: new Date(),
				})
				vi.mocked(getCronJobById).mockResolvedValue(mockCronJob)
				vi.mocked(listPingsByCronJobPaginated).mockResolvedValue({
					data: [mockPing],
					total: 1,
					page: 1,
					limit: 20,
					totalPages: 1,
				})

				const res = await app.request("/v1/cron-jobs/cronjob123/pings", {
					headers: { Authorization: "Bearer hp_live_testkey123" },
				})

				expect(res.status).toBe(200)
				const json = await res.json()
				expect(json.pings).toHaveLength(1)
			})

			it("returns 403 when cron job belongs to different project", async () => {
				vi.mocked(validateApiKey).mockResolvedValue({
					id: "apikey123",
					projectId: "other-project",
					name: "Test Key",
					keyPrefix: "hp_live_abc...",
					lastUsedAt: null,
					createdAt: new Date(),
				})
				vi.mocked(getCronJobById).mockResolvedValue(mockCronJob)

				const res = await app.request("/v1/cron-jobs/cronjob123/pings", {
					headers: { Authorization: "Bearer hp_live_testkey123" },
				})

				expect(res.status).toBe(403)
			})

			it("returns 401 without auth", async () => {
				const res = await app.request("/v1/cron-jobs/cronjob123/pings")

				expect(res.status).toBe(401)
			})
		})
	})
})
