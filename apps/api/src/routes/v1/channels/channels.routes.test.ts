import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"

vi.mock("../../../services/channel.service.js", () => ({
	listChannelsByProject: vi.fn(),
	listChannelsByProjectPaginated: vi.fn(),
	createChannel: vi.fn(),
	getChannelById: vi.fn(),
	updateChannel: vi.fn(),
	deleteChannel: vi.fn(),
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
	checkChannelLimit: vi.fn(),
}))

import { auth } from "../../../lib/auth.js"
import { checkChannelLimit } from "../../../lib/limits.js"
import { organizationRepository } from "../../../repositories/organization.repository.js"
import {
	createChannel,
	deleteChannel,
	getChannelById,
	listChannelsByProjectPaginated,
	updateChannel,
} from "../../../services/channel.service.js"
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

const mockChannel = {
	id: "channel123",
	projectId: "proj123",
	type: "EMAIL" as const,
	name: "Email Alerts",
	config: { email: "alerts@example.com" },
	isDefault: false,
	createdAt: new Date("2025-01-01"),
	updatedAt: new Date("2025-01-01"),
}

describe("Channel Routes", () => {
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
		vi.mocked(checkChannelLimit).mockResolvedValue({ allowed: true })
	})

	describe("GET /v1/projects/:projectId/channels", () => {
		it("returns list of channels", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(listChannelsByProjectPaginated).mockResolvedValue({
				data: [mockChannel],
				total: 1,
			})

			const res = await app.request("/v1/projects/proj123/channels", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.channels).toHaveLength(1)
			expect(json.channels[0].type).toBe("EMAIL")
			expect(json.total).toBe(1)
			expect(json.page).toBe(1)
			expect(json.limit).toBe(20)
		})

		it("returns 401 when not authenticated", async () => {
			vi.mocked(auth.api.getSession).mockResolvedValue(null)

			const res = await app.request("/v1/projects/proj123/channels", {
				headers: { "X-Org-Id": "org123" },
			})

			expect(res.status).toBe(401)
		})
	})

	describe("POST /v1/projects/:projectId/channels", () => {
		it("creates a new channel", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(createChannel).mockResolvedValue(mockChannel)

			const res = await app.request("/v1/projects/proj123/channels", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Org-Id": "org123" },
				body: JSON.stringify({
					type: "EMAIL",
					name: "Email Alerts",
					config: { email: "alerts@example.com" },
				}),
			})

			expect(res.status).toBe(201)
			const json = await res.json()
			expect(json.id).toBe("channel123")
		})
	})

	describe("GET /v1/projects/:projectId/channels/:channelId", () => {
		it("returns channel details", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(getChannelById).mockResolvedValue(mockChannel)

			const res = await app.request(
				"/v1/projects/proj123/channels/channel123",
				{
					headers: { "X-Org-Id": "org123" },
				},
			)

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.id).toBe("channel123")
		})

		it("returns 404 for channel in different project", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(getChannelById).mockResolvedValue({
				...mockChannel,
				projectId: "other-project",
			})

			const res = await app.request(
				"/v1/projects/proj123/channels/channel123",
				{
					headers: { "X-Org-Id": "org123" },
				},
			)

			expect(res.status).toBe(404)
		})
	})

	describe("PATCH /v1/projects/:projectId/channels/:channelId", () => {
		it("updates channel", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(getChannelById).mockResolvedValue(mockChannel)
			vi.mocked(updateChannel).mockResolvedValue({
				...mockChannel,
				name: "Updated Name",
			})

			const res = await app.request(
				"/v1/projects/proj123/channels/channel123",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json", "X-Org-Id": "org123" },
					body: JSON.stringify({ name: "Updated Name" }),
				},
			)

			expect(res.status).toBe(200)
			const json = await res.json()
			expect(json.name).toBe("Updated Name")
		})
	})

	describe("DELETE /v1/projects/:projectId/channels/:channelId", () => {
		it("deletes channel", async () => {
			vi.mocked(getProjectForOrg).mockResolvedValue(mockProject)
			vi.mocked(getChannelById).mockResolvedValue(mockChannel)
			vi.mocked(deleteChannel).mockResolvedValue(undefined)

			const res = await app.request(
				"/v1/projects/proj123/channels/channel123",
				{
					method: "DELETE",
					headers: { "X-Org-Id": "org123" },
				},
			)

			expect(res.status).toBe(204)
		})
	})
})
