import { vi } from "vitest"

// Set environment variables before any imports
process.env.DATABASE_URL = "postgresql://localhost:5432/haspulse_test"
process.env.AUTH_SECRET = "test-secret-key-for-testing-purposes-only"
process.env.APP_URL = "http://localhost:4000"
process.env.API_URL = "http://localhost:4000"

// Mock better-auth to avoid database connection in tests
vi.mock("better-auth", () => ({
	betterAuth: () => ({
		handler: vi.fn(),
		api: {
			getSession: vi.fn().mockResolvedValue(null),
		},
	}),
}))

vi.mock("better-auth/adapters/prisma", () => ({
	prismaAdapter: vi.fn(),
}))

vi.mock("better-auth/plugins", () => ({
	magicLink: vi.fn(() => ({})),
}))

vi.mock("@haspulse/db", () => ({
	prisma: {
		cronJob: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			count: vi.fn(),
			update: vi.fn(),
		},
		ping: {
			create: vi.fn(),
		},
	},
	MonitorStatus: {
		NEW: "NEW",
		UP: "UP",
		LATE: "LATE",
		DOWN: "DOWN",
		PAUSED: "PAUSED",
	},
}))
