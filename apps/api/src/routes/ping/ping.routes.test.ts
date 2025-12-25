import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../app.js"

// Mock the services
vi.mock("../../services/ping.service.js", () => ({
	resolveCheckId: vi.fn(),
	recordPing: vi.fn(),
}))

import { recordPing, resolveCheckId } from "../../services/ping.service.js"

describe("Ping Routes", () => {
	const app = createApp()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("GET /ping/{id}", () => {
		it("returns 200 for valid check ID", async () => {
			vi.mocked(resolveCheckId).mockResolvedValue("check123")
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "SUCCESS",
				body: null,
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/V1StGXR8_Z5jdHi6")

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json).toEqual({ ok: true })
			expect(resolveCheckId).toHaveBeenCalledWith({ id: "V1StGXR8_Z5jdHi6" })
			expect(recordPing).toHaveBeenCalled()
		})

		it("returns 200 for invalid check ID (silent fail)", async () => {
			vi.mocked(resolveCheckId).mockResolvedValue(null)

			const res = await app.request("/ping/invalid123")

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json).toEqual({ ok: true })
			expect(recordPing).not.toHaveBeenCalled()
		})
	})

	describe("GET /ping/{id}/start", () => {
		it("records start signal", async () => {
			vi.mocked(resolveCheckId).mockResolvedValue("check123")
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "START",
				body: null,
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/V1StGXR8_Z5jdHi6/start")

			expect(res.status).toBe(200)
			expect(recordPing).toHaveBeenCalledWith(
				expect.objectContaining({ type: "START" }),
			)
		})
	})

	describe("GET /ping/{id}/fail", () => {
		it("records fail signal", async () => {
			vi.mocked(resolveCheckId).mockResolvedValue("check123")
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "FAIL",
				body: null,
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/V1StGXR8_Z5jdHi6/fail")

			expect(res.status).toBe(200)
			expect(recordPing).toHaveBeenCalledWith(
				expect.objectContaining({ type: "FAIL" }),
			)
		})
	})

	describe("GET /ping/{projectSlug}/{checkSlug}", () => {
		it("resolves check by slug", async () => {
			vi.mocked(resolveCheckId).mockResolvedValue("check123")
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "SUCCESS",
				body: null,
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/acme-prod/db-backup")

			expect(res.status).toBe(200)
			expect(resolveCheckId).toHaveBeenCalledWith({
				projectSlug: "acme-prod",
				checkSlug: "db-backup",
			})
		})
	})

	describe("POST /ping/{id}", () => {
		it("captures request body", async () => {
			vi.mocked(resolveCheckId).mockResolvedValue("check123")
			vi.mocked(recordPing).mockResolvedValue({
				id: "ping123",
				checkId: "check123",
				type: "SUCCESS",
				body: "job output",
				sourceIp: "127.0.0.1",
				createdAt: new Date(),
			})

			const res = await app.request("/ping/V1StGXR8_Z5jdHi6", {
				method: "POST",
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
