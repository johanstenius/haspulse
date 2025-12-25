import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { config } from "./env.js"

const app = createApp()

console.log(`Starting server on port ${config.port}`)

serve({
	fetch: app.fetch,
	port: config.port,
})
