import { z } from "@hono/zod-openapi"
import { sparklineSlotSchema } from "../checks/checks.schemas.js"
import { errorResponseSchema } from "../shared/schemas.js"

export { errorResponseSchema }

export const dashboardStatsResponseSchema = z
	.object({
		totalProjects: z.number(),
		totalChecks: z.number(),
		uptimePercent: z.number(),
		checksByStatus: z.object({
			UP: z.number(),
			DOWN: z.number(),
			LATE: z.number(),
			NEW: z.number(),
			PAUSED: z.number(),
		}),
	})
	.openapi("DashboardStats")

export type DashboardStatsResponse = z.infer<
	typeof dashboardStatsResponseSchema
>

export const dashboardCheckSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: z.enum(["UP", "DOWN", "LATE", "NEW", "PAUSED"]),
	scheduleType: z.enum(["PERIOD", "CRON"]),
	scheduleValue: z.string(),
	lastPingAt: z.string().nullable(),
	projectId: z.string(),
	projectName: z.string(),
	sparkline: z.array(sparklineSlotSchema),
})

export const dashboardChecksResponseSchema = z
	.object({
		checks: z.array(dashboardCheckSchema),
	})
	.openapi("DashboardChecks")

export type DashboardChecksResponse = z.infer<
	typeof dashboardChecksResponseSchema
>
