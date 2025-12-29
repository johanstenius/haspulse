import { z } from "@hono/zod-openapi"
import { cronJobIdParamSchema, errorResponseSchema } from "../shared/schemas.js"

export { errorResponseSchema, cronJobIdParamSchema }

export const uptimeDaySchema = z.object({
	date: z.string(),
	upPercent: z.number(),
	upMinutes: z.number(),
	downMinutes: z.number(),
	totalPings: z.number(),
})

export type UptimeDayResponse = z.infer<typeof uptimeDaySchema>

export const cronJobStatsResponseSchema = z
	.object({
		cronJobId: z.string(),
		days: z.array(uptimeDaySchema),
	})
	.openapi("CronJobStats")

export type CronJobStatsResponse = z.infer<typeof cronJobStatsResponseSchema>

export const statsQuerySchema = z.object({
	days: z
		.string()
		.optional()
		.default("90")
		.transform((v) => Math.min(Math.max(Number.parseInt(v, 10) || 90, 1), 365))
		.openapi({
			param: { name: "days", in: "query" },
			example: "90",
		}),
})

export type StatsQuery = z.infer<typeof statsQuerySchema>
