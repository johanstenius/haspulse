import { Hono } from "hono"
import { logger } from "../../lib/logger.js"
import { handleWebhook } from "../../services/billing.service.js"

const stripeWebhookRoutes = new Hono()

stripeWebhookRoutes.post("/stripe", async (c) => {
	const signature = c.req.header("stripe-signature")
	if (!signature) {
		return c.json({ error: "Missing stripe-signature header" }, 400)
	}

	const payload = await c.req.text()

	try {
		await handleWebhook(payload, signature)
		return c.json({ received: true })
	} catch (err) {
		logger.error({ err }, "Stripe webhook error")
		return c.json({ error: "Webhook processing failed" }, 400)
	}
})

export { stripeWebhookRoutes }
