import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../repositories/check.repository.js", () => ({
	checkRepository: {
		findLateChecks: vi.fn(),
		findDownChecks: vi.fn(),
		findStillDownChecks: vi.fn(),
		findActiveChecks: vi.fn(),
		updateStatus: vi.fn(),
		updateLastAlertAt: vi.fn(),
	},
}))

vi.mock("./alert.service.js", () => ({
	triggerAlert: vi.fn().mockResolvedValue({ sent: true, success: true }),
}))

vi.mock("./stats.service.js", () => ({
	recordCheckStatus: vi.fn(),
}))

vi.mock("./pruning.service.js", () => ({
	pruneAllPings: vi.fn().mockResolvedValue({ checksProcessed: 0, pingsDeleted: 0 }),
}))

import { checkRepository } from "../repositories/check.repository.js"
import { triggerAlert } from "./alert.service.js"
import { runSchedulerTick } from "./scheduler.service.js"

function makeCheck(overrides = {}) {
	return {
		id: "check1",
		projectId: "proj1",
		name: "Test Check",
		slug: "test",
		scheduleType: "PERIOD" as const,
		scheduleValue: "3600",
		graceSeconds: 300,
		timezone: null,
		status: "UP" as const,
		lastPingAt: new Date("2025-01-07T12:00:00Z"),
		lastStartedAt: null,
		nextExpectedAt: new Date("2025-01-07T13:00:00Z"),
		lastAlertAt: null,
		alertOnRecovery: true,
		reminderIntervalHours: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe("scheduler.service", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(checkRepository.findLateChecks).mockResolvedValue([])
		vi.mocked(checkRepository.findDownChecks).mockResolvedValue([])
		vi.mocked(checkRepository.findStillDownChecks).mockResolvedValue([])
		vi.mocked(checkRepository.findActiveChecks).mockResolvedValue([])
	})

	it("marks UP checks as LATE when deadline passed", async () => {
		const check = makeCheck()
		vi.mocked(checkRepository.findLateChecks).mockResolvedValue([check])

		await runSchedulerTick()

		expect(checkRepository.updateStatus).toHaveBeenCalledWith(check.id, "LATE")
	})

	it("marks LATE checks as DOWN and triggers alert", async () => {
		const check = makeCheck({ status: "LATE" as const })
		vi.mocked(checkRepository.findDownChecks).mockResolvedValue([check])

		await runSchedulerTick()

		expect(checkRepository.updateStatus).toHaveBeenCalledWith(check.id, "DOWN")
		expect(checkRepository.updateLastAlertAt).toHaveBeenCalledWith(
			check.id,
			expect.any(Date),
		)
		expect(triggerAlert).toHaveBeenCalledWith(
			"check.down",
			expect.objectContaining({ id: check.id, status: "DOWN" }),
		)
	})

	it("sends reminders for still-down checks", async () => {
		const check = makeCheck({
			status: "DOWN" as const,
			reminderIntervalHours: 1,
			lastAlertAt: new Date("2025-01-07T10:00:00Z"),
		})
		vi.mocked(checkRepository.findStillDownChecks).mockResolvedValue([check])

		await runSchedulerTick()

		expect(checkRepository.updateLastAlertAt).toHaveBeenCalledWith(
			check.id,
			expect.any(Date),
		)
		expect(triggerAlert).toHaveBeenCalledWith(
			"check.still_down",
			expect.objectContaining({ id: check.id }),
		)
	})

	it("handles no checks needing updates", async () => {
		await runSchedulerTick()

		expect(checkRepository.updateStatus).not.toHaveBeenCalled()
		expect(triggerAlert).not.toHaveBeenCalled()
	})

	it("processes all check types in one tick", async () => {
		const lateCheck = makeCheck({ id: "late1", name: "Late Check" })
		const downCheck = makeCheck({
			id: "down1",
			name: "Down Check",
			status: "LATE" as const,
		})
		const stillDownCheck = makeCheck({
			id: "still1",
			name: "Still Down",
			status: "DOWN" as const,
			reminderIntervalHours: 1,
			lastAlertAt: new Date("2025-01-07T10:00:00Z"),
		})

		vi.mocked(checkRepository.findLateChecks).mockResolvedValue([lateCheck])
		vi.mocked(checkRepository.findDownChecks).mockResolvedValue([downCheck])
		vi.mocked(checkRepository.findStillDownChecks).mockResolvedValue([
			stillDownCheck,
		])

		await runSchedulerTick()

		expect(checkRepository.updateStatus).toHaveBeenCalledTimes(2)
		expect(triggerAlert).toHaveBeenCalledTimes(2)
	})

	it("does not update lastAlertAt when alert not sent", async () => {
		const check = makeCheck({ status: "LATE" as const })
		vi.mocked(checkRepository.findDownChecks).mockResolvedValue([check])
		vi.mocked(triggerAlert).mockResolvedValue({ sent: false, success: false })

		await runSchedulerTick()

		expect(checkRepository.updateStatus).toHaveBeenCalledWith(check.id, "DOWN")
		expect(triggerAlert).toHaveBeenCalled()
		expect(checkRepository.updateLastAlertAt).not.toHaveBeenCalled()
	})
})
