import type Stripe from "stripe"
import { getStripe } from "../lib/stripe.js"
import { organizationRepository } from "../repositories/organization.repository.js"

const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO

export async function createCheckoutSession(
	orgId: string,
	successUrl: string,
	cancelUrl: string,
): Promise<string> {
	const stripe = getStripe()
	const org = await organizationRepository.findById(orgId)
	if (!org) throw new Error("Organization not found")

	if (!STRIPE_PRICE_PRO) {
		throw new Error("STRIPE_PRICE_PRO is not configured")
	}

	let customerId = org.stripeCustomerId

	if (!customerId) {
		const customer = await stripe.customers.create({
			metadata: { orgId },
		})
		customerId = customer.id
		await organizationRepository.update(orgId, { stripeCustomerId: customerId })
	}

	const session = await stripe.checkout.sessions.create({
		customer: customerId,
		mode: "subscription",
		line_items: [{ price: STRIPE_PRICE_PRO, quantity: 1 }],
		success_url: successUrl,
		cancel_url: cancelUrl,
		metadata: { orgId },
	})

	if (!session.url) throw new Error("Failed to create checkout session")
	return session.url
}

export async function createBillingPortalSession(
	orgId: string,
	returnUrl: string,
): Promise<string> {
	const stripe = getStripe()
	const org = await organizationRepository.findById(orgId)
	if (!org) throw new Error("Organization not found")

	if (!org.stripeCustomerId) {
		throw new Error("No billing account linked to this organization")
	}

	const session = await stripe.billingPortal.sessions.create({
		customer: org.stripeCustomerId,
		return_url: returnUrl,
	})

	return session.url
}

export async function handleWebhook(
	payload: string | Buffer,
	signature: string,
): Promise<void> {
	const stripe = getStripe()
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
	if (!webhookSecret) {
		throw new Error("STRIPE_WEBHOOK_SECRET is not configured")
	}

	const event = stripe.webhooks.constructEvent(
		payload,
		signature,
		webhookSecret,
	)
	await processStripeEvent(event)
}

async function processStripeEvent(event: Stripe.Event): Promise<void> {
	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object as Stripe.Checkout.Session
			const orgId = session.metadata?.orgId
			if (!orgId) break

			await organizationRepository.update(orgId, {
				plan: "pro",
				stripeSubscriptionId: session.subscription as string,
			})
			break
		}

		case "customer.subscription.updated": {
			const subscription = event.data.object as Stripe.Subscription
			const org = await findOrgByCustomerId(subscription.customer as string)
			if (!org) break

			if (subscription.status === "active") {
				await organizationRepository.update(org.id, { plan: "pro" })
			} else if (
				subscription.status === "canceled" ||
				subscription.status === "unpaid"
			) {
				await organizationRepository.update(org.id, {
					plan: "free",
					stripeSubscriptionId: null,
				})
			}
			break
		}

		case "customer.subscription.deleted": {
			const subscription = event.data.object as Stripe.Subscription
			const org = await findOrgByCustomerId(subscription.customer as string)
			if (!org) break

			await organizationRepository.update(org.id, {
				plan: "free",
				stripeSubscriptionId: null,
			})
			break
		}
	}
}

async function findOrgByCustomerId(customerId: string) {
	return organizationRepository.findByStripeCustomerId(customerId)
}
