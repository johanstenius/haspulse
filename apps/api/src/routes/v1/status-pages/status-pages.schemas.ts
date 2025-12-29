import { z } from "@hono/zod-openapi"

export const statusPageThemeSchema = z.enum(["LIGHT", "DARK", "SYSTEM"])

export const statusPageResponseSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		slug: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		logoUrl: z.string().nullable(),
		accentColor: z.string(),
		theme: statusPageThemeSchema,
		customDomain: z.string().nullable(),
		domainVerified: z.boolean(),
		verifyToken: z.string().nullable(),
		showUptime: z.boolean(),
		uptimeDays: z.number(),
		autoIncidents: z.boolean(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("StatusPage")

export const createStatusPageSchema = z
	.object({
		slug: z
			.string()
			.min(1)
			.max(50)
			.regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and dashes only"),
		name: z.string().min(1).max(100),
		description: z.string().max(500).optional(),
		accentColor: z
			.string()
			.regex(/^#[0-9a-fA-F]{6}$/)
			.optional(),
		theme: statusPageThemeSchema.optional(),
		showUptime: z.boolean().optional(),
		uptimeDays: z.number().min(7).max(365).optional(),
		autoIncidents: z.boolean().optional(),
	})
	.openapi("CreateStatusPage")

export const updateStatusPageSchema = z
	.object({
		slug: z
			.string()
			.min(1)
			.max(50)
			.regex(/^[a-z0-9-]+$/)
			.optional(),
		name: z.string().min(1).max(100).optional(),
		description: z.string().max(500).nullable().optional(),
		logoUrl: z.string().url().nullable().optional(),
		accentColor: z
			.string()
			.regex(/^#[0-9a-fA-F]{6}$/)
			.optional(),
		theme: statusPageThemeSchema.optional(),
		customDomain: z.string().max(253).nullable().optional(),
		showUptime: z.boolean().optional(),
		uptimeDays: z.number().min(7).max(365).optional(),
		autoIncidents: z.boolean().optional(),
	})
	.openapi("UpdateStatusPage")

export const componentResponseSchema = z
	.object({
		id: z.string(),
		statusPageId: z.string(),
		cronJobId: z.string().nullable(),
		httpMonitorId: z.string().nullable(),
		displayName: z.string(),
		groupName: z.string().nullable(),
		sortOrder: z.number(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("StatusPageComponent")

export const createComponentSchema = z
	.object({
		cronJobId: z.string().optional(),
		httpMonitorId: z.string().optional(),
		displayName: z.string().min(1).max(100),
		groupName: z.string().max(50).optional(),
	})
	.refine((data) => data.cronJobId || data.httpMonitorId, {
		message: "Either cronJobId or httpMonitorId is required",
	})
	.refine((data) => !(data.cronJobId && data.httpMonitorId), {
		message: "Cannot specify both cronJobId and httpMonitorId",
	})
	.openapi("CreateStatusPageComponent")

export const updateComponentSchema = z
	.object({
		displayName: z.string().min(1).max(100).optional(),
		groupName: z.string().max(50).nullable().optional(),
	})
	.openapi("UpdateStatusPageComponent")

export const reorderComponentsSchema = z
	.object({
		componentIds: z.array(z.string()),
	})
	.openapi("ReorderComponents")

export const componentsListResponseSchema = z
	.object({
		components: z.array(componentResponseSchema),
	})
	.openapi("ComponentsList")

export const errorResponseSchema = z
	.object({
		code: z.string(),
		message: z.string(),
	})
	.openapi("Error")

export const setCustomDomainSchema = z
	.object({
		domain: z.string().max(253).nullable(),
	})
	.openapi("SetCustomDomain")

export const setCustomDomainResponseSchema = z
	.object({
		verifyToken: z.string().nullable(),
	})
	.openapi("SetCustomDomainResponse")

export const verifyDomainResponseSchema = z
	.object({
		verified: z.boolean(),
		error: z.string().optional(),
	})
	.openapi("VerifyDomainResponse")

export const uploadLogoResponseSchema = z
	.object({
		logoUrl: z.string(),
	})
	.openapi("UploadLogoResponse")

export type StatusPageResponse = z.infer<typeof statusPageResponseSchema>
export type CreateStatusPageData = z.infer<typeof createStatusPageSchema>
export type UpdateStatusPageData = z.infer<typeof updateStatusPageSchema>
export type ComponentResponse = z.infer<typeof componentResponseSchema>
export type CreateComponentData = z.infer<typeof createComponentSchema>
export type UpdateComponentData = z.infer<typeof updateComponentSchema>
export type SetCustomDomainData = z.infer<typeof setCustomDomainSchema>
