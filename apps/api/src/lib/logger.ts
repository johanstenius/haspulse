import pino from "pino"
import { config } from "../env.js"

export const logger = pino({
	level: config.nodeEnv === "production" ? "info" : "debug",
	...(config.nodeEnv !== "production" && {
		transport: {
			target: "pino-pretty",
			options: { colorize: true },
		},
	}),
})
