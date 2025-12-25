import { z } from "@hono/zod-openapi"
import { errorResponseSchema, projectIdParamSchema } from "../shared/schemas.js"

export { errorResponseSchema, projectIdParamSchema }

export const setDomainBodySchema = z
	.object({
		domain: z.string().min(1).max(253),
	})
	.openapi("SetDomainRequest")

export type SetDomainBody = z.infer<typeof setDomainBodySchema>

export const domainResponseSchema = z
	.object({
		domain: z.string().nullable(),
		verified: z.boolean(),
		instructions: z
			.object({
				recordType: z.string(),
				recordName: z.string(),
				recordValue: z.string(),
			})
			.nullable(),
	})
	.openapi("DomainResponse")

export type DomainResponse = z.infer<typeof domainResponseSchema>

export const domainVerifyResponseSchema = z
	.object({
		verified: z.boolean(),
		expectedRecord: z.string(),
		foundRecords: z.array(z.string()),
	})
	.openapi("DomainVerifyResponse")

export type DomainVerifyResponse = z.infer<typeof domainVerifyResponseSchema>
