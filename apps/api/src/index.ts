import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { config } from "./env.js"
import { logger } from "./lib/logger.js"

const app = createApp()

logger.info({ port: config.port }, "Starting server")

serve({
	fetch: app.fetch,
	port: config.port,
})
