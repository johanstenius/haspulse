import { z } from "@hono/zod-openapi"
import { sparklineSlotSchema } from "../cron-jobs/cron-jobs.schemas.js"
import { errorResponseSchema } from "../shared/schemas.js"

export { errorResponseSchema }

export const dashboardStatsResponseSchema = z
	.object({
		totalProjects: z.number(),
		totalCronJobs: z.number(),
		uptimePercent: z.number(),
		cronJobsByStatus: z.object({
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

export const dashboardCronJobSchema = z.object({
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

export const dashboardCronJobsResponseSchema = z
	.object({
		cronJobs: z.array(dashboardCronJobSchema),
	})
	.openapi("DashboardCronJobs")

export type DashboardCronJobsResponse = z.infer<
	typeof dashboardCronJobsResponseSchema
>
