import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../app.js"

vi.mock("../../repositories/check.repository.js", () => ({
	checkRepository: {
		findIdBySlugInProject: vi.fn(),
		updateOnPing: vi.fn(),
	},
}))

vi.mock("../../services/ping.service.js", () => ({
	recordPing: vi.fn(),
}))

vi.mock("../../services/api-key.service.js", () => ({
	validateApiKey: vi.fn(),
}))

import { checkRepository } from "../../repositories/check.repository.js"
import { validateApiKey } from "../../services/api-key.service.js"
import { recordPing } from "../../services/ping.service.js"

describe("Ping Routes", () => {
	const app = createApp()
	const apiKey = "hp_test123"
	const projectId = "proj_123"

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(validateApiKey).mockResolvedValue({
			id: "key_123",
			projectId,
			name: "Test Key",
			keyPrefix: "hp_test",
			lastUsedAt: null,
			createdAt: new Date(),
		})
	})

	describe("GET /ping/{slug}", () => {
		it("returns 401 without API key", async () => {
			const res = await app.request("/ping/daily-backup")
			expect(res.status).toBe(401)
		})

		it("returns 401 with invalid API key", async () => {
			vi.mocked(validateApiKey).mockResolvedValue(null)

			const res = await app.request("/ping/daily-backup", {
				headers: { Authorization: `Bearer ${apiKey}` },
			})

			expect(res.status).toBe(401)
		})

		it("returns 200 for valid check slug", async () => {
			vi.mocked(checkRepository.findIdBySlugInProject).mockResolvedValue(
				"check123",
			)
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "SUCCESS",
				body: null,
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/daily-backup", {
				headers: { Authorization: `Bearer ${apiKey}` },
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json).toEqual({ ok: true })
			expect(checkRepository.findIdBySlugInProject).toHaveBeenCalledWith(
				projectId,
				"daily-backup",
			)
			expect(recordPing).toHaveBeenCalled()
		})

		it("returns 200 for unknown slug (silent fail)", async () => {
			vi.mocked(checkRepository.findIdBySlugInProject).mockResolvedValue(null)

			const res = await app.request("/ping/unknown-check", {
				headers: { Authorization: `Bearer ${apiKey}` },
			})

			expect(res.status).toBe(200)
			expect(recordPing).not.toHaveBeenCalled()
		})
	})

	describe("GET /ping/{slug}/start", () => {
		it("records start signal", async () => {
			vi.mocked(checkRepository.findIdBySlugInProject).mockResolvedValue(
				"check123",
			)
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "START",
				body: null,
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/daily-backup/start", {
				headers: { Authorization: `Bearer ${apiKey}` },
			})

			expect(res.status).toBe(200)
			expect(recordPing).toHaveBeenCalledWith(
				expect.objectContaining({ type: "START" }),
			)
		})
	})

	describe("GET /ping/{slug}/fail", () => {
		it("records fail signal", async () => {
			vi.mocked(checkRepository.findIdBySlugInProject).mockResolvedValue(
				"check123",
			)
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "FAIL",
				body: null,
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/daily-backup/fail", {
				headers: { Authorization: `Bearer ${apiKey}` },
			})

			expect(res.status).toBe(200)
			expect(recordPing).toHaveBeenCalledWith(
				expect.objectContaining({ type: "FAIL" }),
			)
		})
	})

	describe("POST /ping/{slug}", () => {
		it("captures request body", async () => {
			vi.mocked(checkRepository.findIdBySlugInProject).mockResolvedValue(
				"check123",
			)
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "SUCCESS",
				body: "job output",
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/daily-backup", {
				method: "POST",
				headers: { Authorization: `Bearer ${apiKey}` },
				body: "job output",
			})

			expect(res.status).toBe(200)
			expect(recordPing).toHaveBeenCalledWith(
				expect.objectContaining({ body: "job output" }),
			)
		})
	})
})

describe("Health Check", () => {
	const app = createApp()

	it("returns ok", async () => {
		const res = await app.request("/health")

		expect(res.status).toBe(200)
		const json = await res.json()
		expect(json).toEqual({ ok: true })
	})
})
