import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../app.js"

vi.mock("../../repositories/project.repository.js", () => ({
	projectRepository: {
		findBySlug: vi.fn(),
	},
}))

vi.mock("../../repositories/check.repository.js", () => ({
	checkRepository: {
		findByProjectId: vi.fn(),
	},
}))

import { checkRepository } from "../../repositories/check.repository.js"
import { projectRepository } from "../../repositories/project.repository.js"

function makeProject(overrides = {}) {
	return {
		id: "proj1",
		name: "Acme",
		slug: "acme",
		orgId: "org1",
		timezone: "UTC",
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

function makeCheck(overrides = {}) {
	return {
		id: "check1",
		projectId: "proj1",
		name: "DB Backup",
		slug: "db-backup",
		scheduleType: "PERIOD" as const,
		scheduleValue: "3600",
		graceSeconds: 300,
		timezone: null,
		status: "UP" as const,
		lastPingAt: new Date(),
		lastStartedAt: null,
		nextExpectedAt: new Date(),
		lastAlertAt: null,
		alertOnRecovery: true,
		reminderIntervalHours: null,
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
			vi.mocked(checkRepository.findByProjectId).mockResolvedValue([
				makeCheck({ status: "UP" }),
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
			vi.mocked(checkRepository.findByProjectId).mockResolvedValue([
				makeCheck({ status: "UP" }),
			])

			const res = await app.request("/badge/acme?label=My%20Service")

			expect(res.status).toBe(200)
			const body = await res.text()
			expect(body).toContain("My Service")
		})

		it("shows down status when any check is down", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(checkRepository.findByProjectId).mockResolvedValue([
				makeCheck({ status: "UP" }),
				makeCheck({ id: "check2", status: "DOWN" }),
			])

			const res = await app.request("/badge/acme")

			const body = await res.text()
			expect(body).toContain("down")
			expect(body).toContain("#e05d44")
		})

		it("shows degraded status when any check is late", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(checkRepository.findByProjectId).mockResolvedValue([
				makeCheck({ status: "UP" }),
				makeCheck({ id: "check2", status: "LATE" }),
			])

			const res = await app.request("/badge/acme")

			const body = await res.text()
			expect(body).toContain("degraded")
		})
	})

	describe("GET /badge/{projectSlug}/{checkSlug}", () => {
		it("returns SVG badge for specific check", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(checkRepository.findByProjectId).mockResolvedValue([
				makeCheck({ slug: "db-backup", status: "UP" }),
			])

			const res = await app.request("/badge/acme/db-backup")

			expect(res.status).toBe(200)
			expect(res.headers.get("Content-Type")).toBe("image/svg+xml")
			const body = await res.text()
			expect(body).toContain("DB Backup")
			expect(body).toContain("operational")
		})

		it("returns 404 for non-existent check", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(checkRepository.findByProjectId).mockResolvedValue([])

			const res = await app.request("/badge/acme/nonexistent")

			expect(res.status).toBe(404)
		})

		it("shows correct status for down check", async () => {
			vi.mocked(projectRepository.findBySlug).mockResolvedValue(makeProject())
			vi.mocked(checkRepository.findByProjectId).mockResolvedValue([
				makeCheck({ slug: "api", status: "DOWN" }),
			])

			const res = await app.request("/badge/acme/api")

			const body = await res.text()
			expect(body).toContain("down")
			expect(body).toContain("#e05d44")
		})
	})
})
