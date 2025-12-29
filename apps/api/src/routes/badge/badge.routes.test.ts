import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../app.js"

vi.mock("../../repositories/project.repository.js", () => ({
	projectRepository: {
		findBySlug: vi.fn(),
	},
}))

vi.mock("../../repositories/cron-job.repository.js", () => ({
	cronJobRepository: {
		findByProjectId: vi.fn(),
	},
}))

import { cronJobRepository } from "../../repositories/cron-job.repository.js"
import { projectRepository } from "../../repositories/project.repository.js"

function makeProject(overrides = {}) {
	return {
		id: "proj1",
		name: "Acme",
		slug: "acme",
		orgId: "org1",
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

function makeCronJob(overrides = {}) {
	return {
		id: "cronjob1",
		projectId: "proj1",
		name: "DB Backup",
		slug: "db-backup",
		scheduleType: "PERIOD" as const,
		scheduleValue: "3600",
		graceSeconds: 300,
		status: "UP" as const,
		lastPingAt: new Date(),
		lastStartedAt: null,
		nextExpectedAt: new Date(),
		lastAlertAt: null,
		alertOnRecovery: true,
		reminderIntervalHours: null,
		anomalySensitivity: "NORMAL" as const,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe("Badge Routes", () => {
	const app = createApp()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("GET /badge/{projectSlug}", () => {
		it("returns SVG badge for existing project", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(cronJobRepository.findByProjectId).mockResolvedValue([
				makeCronJob({ status: "UP" }),
			])

			const res = await app.request("/badge/acme")

			expect(res.status).toBe(200)
			expect(res.headers.get("Content-Type")).toBe("image/svg+xml")
			expect(res.headers.get("Cache-Control")).toContain("max-age=300")
			const body = await res.text()
			expect(body).toContain("<svg")
			expect(body).toContain("Acme")
			expect(body).toContain("operational")
		})

		it("returns 404 for non-existent project", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(null)

			const res = await app.request("/badge/nonexistent")

			expect(res.status).toBe(404)
		})

		it("uses custom label when provided", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(cronJobRepository.findByProjectId).mockResolvedValue([
				makeCronJob({ status: "UP" }),
			])

			const res = await app.request("/badge/acme?label=My%20Service")

			expect(res.status).toBe(200)
			const body = await res.text()
			expect(body).toContain("My Service")
		})

		it("shows down status when any cron job is down", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(cronJobRepository.findByProjectId).mockResolvedValue([
				makeCronJob({ status: "UP" }),
				makeCronJob({ id: "cronjob2", status: "DOWN" }),
			])

			const res = await app.request("/badge/acme")

			const body = await res.text()
			expect(body).toContain("down")
			expect(body).toContain("#e05d44")
		})

		it("shows degraded status when any cron job is late", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(cronJobRepository.findByProjectId).mockResolvedValue([
				makeCronJob({ status: "UP" }),
				makeCronJob({ id: "cronjob2", status: "LATE" }),
			])

			const res = await app.request("/badge/acme")

			const body = await res.text()
			expect(body).toContain("degraded")
		})
	})

	describe("GET /badge/{projectSlug}/{cronJobSlug}", () => {
		it("returns SVG badge for specific cron job", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(cronJobRepository.findByProjectId).mockResolvedValue([
				makeCronJob({ slug: "db-backup", status: "UP" }),
			])

			const res = await app.request("/badge/acme/db-backup")

			expect(res.status).toBe(200)
			expect(res.headers.get("Content-Type")).toBe("image/svg+xml")
			const body = await res.text()
			expect(body).toContain("DB Backup")
			expect(body).toContain("operational")
		})

		it("returns 404 for non-existent cron job", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(cronJobRepository.findByProjectId).mockResolvedValue([])

			const res = await app.request("/badge/acme/nonexistent")

			expect(res.status).toBe(404)
		})

		it("shows correct status for down cron job", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(cronJobRepository.findByProjectId).mockResolvedValue([
				makeCronJob({ slug: "api", status: "DOWN" }),
			])

			const res = await app.request("/badge/acme/api")

			const body = await res.text()
			expect(body).toContain("down")
			expect(body).toContain("#e05d44")
		})
	})
})
