import { logger } from "./lib/logger.js"
import { runSchedulerTick } from "./services/scheduler.service.js"

const INTERVAL_MS = 60_000

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
	logger.info({ intervalMs: INTERVAL_MS }, "Starting scheduler worker")

	while (true) {
		try {
			await runSchedulerTick()
		} catch (err) {
			logger.error({ err }, "Scheduler tick failed")
		}
		await sleep(INTERVAL_MS)
	}
}

main().catch((err) => {
	logger.fatal({ err }, "Worker fatal error")
	process.exit(1)
})
