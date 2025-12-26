import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { config } from "./env.js"
import { logger } from "./lib/logger.js"
import { startScheduler } from "./services/scheduler.service.js"

const app = createApp()

startScheduler()

logger.info({ port: config.port }, "Starting server")

serve({
	fetch: app.fetch,
	port: config.port,
})
