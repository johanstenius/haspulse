import Stripe from "stripe"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey && process.env.NODE_ENV === "production") {
	throw new Error("STRIPE_SECRET_KEY is required in production")
}

export const stripe = stripeSecretKey
	? new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" })
	: null

export function getStripe(): Stripe {
	if (!stripe) {
		throw new Error("Stripe is not configured")
	}
	return stripe
}
