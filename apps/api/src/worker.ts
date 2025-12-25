import { runSchedulerTick } from "./services/scheduler.service.js"

const INTERVAL_MS = 60_000

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
	console.log("[worker] Starting scheduler worker...")
	console.log(`[worker] Interval: ${INTERVAL_MS / 1000}s`)

	while (true) {
		try {
			await runSchedulerTick()
		} catch (err) {
			console.error("[worker] Scheduler tick failed:", err)
		}
		await sleep(INTERVAL_MS)
	}
}

main().catch((err) => {
	console.error("[worker] Fatal error:", err)
	process.exit(1)
})
