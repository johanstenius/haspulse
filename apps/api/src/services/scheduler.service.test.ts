import { MonitorStatus } from "@haspulse/db"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../repositories/cron-job.repository.js", () => ({
	cronJobRepository: {
		findLateCronJobs: vi.fn(),
		findDownCronJobs: vi.fn(),
		findStillDownCronJobs: vi.fn(),
		findActiveCronJobs: vi.fn(),
		updateStatus: vi.fn(),
		updateLastAlertAt: vi.fn(),
		updateNextExpectedAt: vi.fn(),
	},
}))

vi.mock("../repositories/http-monitor.repository.js", () => ({
	httpMonitorRepository: {
		findDueForPolling: vi.fn().mockResolvedValue([]),
		findLateMonitors: vi.fn().mockResolvedValue([]),
		updateStatus: vi.fn(),
		updateLastAlertAt: vi.fn(),
		recordPollResult: vi.fn(),
		updateAfterPoll: vi.fn(),
	},
}))

vi.mock("./alert.service.js", () => ({
	triggerAlert: vi.fn().mockResolvedValue({ sent: true, success: true }),
}))

vi.mock("./stats.service.js", () => ({
	recordCronJobStatus: vi.fn(),
	recordHttpMonitorStatus: vi.fn(),
}))

vi.mock("./pruning.service.js", () => ({
	pruneAllPings: vi
		.fn()
		.mockResolvedValue({ cronJobsProcessed: 0, pingsDeleted: 0 }),
}))

import { cronJobRepository } from "../repositories/cron-job.repository.js"
import { triggerAlert } from "./alert.service.js"
import { runSchedulerTick } from "./scheduler.service.js"

function makeCronJob(overrides = {}) {
	return {
		id: "cronjob1",
		projectId: "proj1",
		name: "Test CronJob",
		slug: "test",
		scheduleType: "PERIOD" as const,
		scheduleValue: "3600",
		graceSeconds: 300,
		status: "UP" as const,
		lastPingAt: new Date("2025-01-07T12:00:00Z"),
		lastStartedAt: null,
		nextExpectedAt: new Date("2025-01-07T13:00:00Z"),
		lastAlertAt: null,
		alertOnRecovery: true,
		reminderIntervalHours: null,
		anomalySensitivity: "NORMAL" as const,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe("scheduler.service", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(cronJobRepository.findLateCronJobs).mockResolvedValue([])
		vi.mocked(cronJobRepository.findDownCronJobs).mockResolvedValue([])
		vi.mocked(cronJobRepository.findStillDownCronJobs).mockResolvedValue([])
		vi.mocked(cronJobRepository.findActiveCronJobs).mockResolvedValue([])
	})

	it("marks UP cron jobs as LATE when deadline passed", async () => {
		const cronJob = makeCronJob()
		vi.mocked(cronJobRepository.findLateCronJobs).mockResolvedValue([cronJob])

		await runSchedulerTick()

		expect(cronJobRepository.updateStatus).toHaveBeenCalledWith(
			cronJob.id,
			MonitorStatus.LATE,
		)
	})

	it("marks LATE cron jobs as DOWN and triggers alert", async () => {
		const cronJob = makeCronJob({ status: "LATE" as const })
		vi.mocked(cronJobRepository.findDownCronJobs).mockResolvedValue([cronJob])

		await runSchedulerTick()

		expect(cronJobRepository.updateStatus).toHaveBeenCalledWith(
			cronJob.id,
			MonitorStatus.DOWN,
		)
		expect(cronJobRepository.updateLastAlertAt).toHaveBeenCalledWith(
			cronJob.id,
			expect.any(Date),
		)
		expect(triggerAlert).toHaveBeenCalledWith(
			"cronJob.down",
			expect.objectContaining({ id: cronJob.id, status: MonitorStatus.DOWN }),
		)
	})

	it("sends reminders for still-down cron jobs", async () => {
		const cronJob = makeCronJob({
			status: "DOWN" as const,
			reminderIntervalHours: 1,
			lastAlertAt: new Date("2025-01-07T10:00:00Z"),
		})
		vi.mocked(cronJobRepository.findStillDownCronJobs).mockResolvedValue([
			cronJob,
		])

		await runSchedulerTick()

		expect(cronJobRepository.updateLastAlertAt).toHaveBeenCalledWith(
			cronJob.id,
			expect.any(Date),
		)
		expect(triggerAlert).toHaveBeenCalledWith(
			"cronJob.still_down",
			expect.objectContaining({ id: cronJob.id }),
		)
	})

	it("handles no cron jobs needing updates", async () => {
		await runSchedulerTick()

		expect(cronJobRepository.updateStatus).not.toHaveBeenCalled()
		expect(triggerAlert).not.toHaveBeenCalled()
	})

	it("processes all cron job types in one tick", async () => {
		const lateCronJob = makeCronJob({ id: "late1", name: "Late CronJob" })
		const downCronJob = makeCronJob({
			id: "down1",
			name: "Down CronJob",
			status: "LATE" as const,
		})
		const stillDownCronJob = makeCronJob({
			id: "still1",
			name: "Still Down",
			status: "DOWN" as const,
			reminderIntervalHours: 1,
			lastAlertAt: new Date("2025-01-07T10:00:00Z"),
		})

		vi.mocked(cronJobRepository.findLateCronJobs).mockResolvedValue([
			lateCronJob,
		])
		vi.mocked(cronJobRepository.findDownCronJobs).mockResolvedValue([
			downCronJob,
		])
		vi.mocked(cronJobRepository.findStillDownCronJobs).mockResolvedValue([
			stillDownCronJob,
		])

		await runSchedulerTick()

		expect(cronJobRepository.updateStatus).toHaveBeenCalledTimes(2)
		expect(triggerAlert).toHaveBeenCalledTimes(2)
	})

	it("does not update lastAlertAt when alert not sent", async () => {
		const cronJob = makeCronJob({ status: "LATE" as const })
		vi.mocked(cronJobRepository.findDownCronJobs).mockResolvedValue([cronJob])
		vi.mocked(triggerAlert).mockResolvedValue({ sent: false, success: false })

		await runSchedulerTick()

		expect(cronJobRepository.updateStatus).toHaveBeenCalledWith(
			cronJob.id,
			MonitorStatus.DOWN,
		)
		expect(triggerAlert).toHaveBeenCalled()
		expect(cronJobRepository.updateLastAlertAt).not.toHaveBeenCalled()
	})
})
