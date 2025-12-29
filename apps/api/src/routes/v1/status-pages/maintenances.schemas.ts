import { z } from "@hono/zod-openapi"

export const maintenanceStatusSchema = z.enum([
	"SCHEDULED",
	"IN_PROGRESS",
	"COMPLETED",
])

export const maintenanceResponseSchema = z
	.object({
		id: z.string(),
		statusPageId: z.string(),
		title: z.string(),
		description: z.string().nullable(),
		componentIds: z.array(z.string()),
		scheduledFor: z.string(),
		expectedEnd: z.string(),
		status: maintenanceStatusSchema,
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("Maintenance")

export const createMaintenanceSchema = z
	.object({
		title: z.string().min(1).max(200),
		description: z.string().max(2000).optional(),
		componentIds: z.array(z.string()),
		scheduledFor: z.string().datetime(),
		expectedEnd: z.string().datetime(),
	})
	.refine((data) => new Date(data.expectedEnd) > new Date(data.scheduledFor), {
		message: "expectedEnd must be after scheduledFor",
	})
	.openapi("CreateMaintenance")

export const updateMaintenanceSchema = z
	.object({
		title: z.string().min(1).max(200).optional(),
		description: z.string().max(2000).nullable().optional(),
		componentIds: z.array(z.string()).optional(),
		scheduledFor: z.string().datetime().optional(),
		expectedEnd: z.string().datetime().optional(),
		status: maintenanceStatusSchema.optional(),
	})
	.openapi("UpdateMaintenance")

export const maintenancesListResponseSchema = z
	.object({
		maintenances: z.array(maintenanceResponseSchema),
		total: z.number(),
	})
	.openapi("MaintenancesList")

export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>
export type MaintenanceResponse = z.infer<typeof maintenanceResponseSchema>
