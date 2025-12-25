import { z } from "@hono/zod-openapi"

export const billingInfoResponseSchema = z
	.object({
		plan: z.string().openapi({ example: "free" }),
		displayName: z.string().openapi({ example: "Free" }),
		isTrialing: z.boolean(),
		trialEndsAt: z
			.string()
			.nullable()
			.openapi({ example: "2025-02-01T00:00:00.000Z" }),
		usage: z.object({
			checks: z.object({ current: z.number(), limit: z.number().nullable() }),
			projects: z.object({ current: z.number(), limit: z.number().nullable() }),
		}),
	})
	.openapi("BillingInfo")

export const checkoutRequestSchema = z
	.object({
		successUrl: z.string().url(),
		cancelUrl: z.string().url(),
	})
	.openapi("CheckoutRequest")

export const checkoutResponseSchema = z
	.object({
		url: z.string().url(),
	})
	.openapi("CheckoutResponse")

export const portalRequestSchema = z
	.object({
		returnUrl: z.string().url(),
	})
	.openapi("PortalRequest")

export const portalResponseSchema = z
	.object({
		url: z.string().url(),
	})
	.openapi("PortalResponse")

export const errorResponseSchema = z
	.object({
		code: z.string(),
		message: z.string(),
	})
	.openapi("Error")

export type BillingInfoResponse = z.infer<typeof billingInfoResponseSchema>
