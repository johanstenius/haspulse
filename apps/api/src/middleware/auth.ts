import type { User } from "better-auth"
import type { Context, Next } from "hono"
import type { AppEnv, OrgContext } from "../app.js"
import { forbidden, unauthorized } from "../lib/errors.js"
import { organizationRepository } from "../repositories/organization.repository.js"
import { validateApiKey } from "../services/api-key.service.js"
import { getEffectivePlan } from "../services/organization.service.js"

export type AuthEnv = AppEnv & {
	Variables: {
		projectId: string | null
		authMethod: "session" | "api-key" | null
	}
}

// Simple session auth - just requires logged in user
export async function requireSession(c: Context<AppEnv>, next: Next) {
	const user = c.get("user")
	if (!user) throw unauthorized()
	await next()
}

// Helper to get user - throws if not set
export function getRequiredUser(c: Context<AppEnv>): User {
	const user = c.get("user")
	if (!user) throw unauthorized()
	return user
}

// Middleware that allows both API key and session auth
// Sets projectId for API key auth, org context for session auth
export async function requireAuth(c: Context<AuthEnv>, next: Next) {
	// Try API key auth first
	const header = c.req.header("Authorization")
	if (header?.startsWith("Bearer hp_")) {
		const key = header.slice(7)
		const apiKey = await validateApiKey(key)
		if (apiKey) {
			c.set("projectId", apiKey.projectId)
			c.set("authMethod", "api-key")
			await next()
			return
		}
	}

	// Fall back to session auth
	const user = c.get("user")
	if (!user) {
		throw unauthorized()
	}

	const orgId = c.req.header("X-Org-Id")
	if (!orgId) {
		throw forbidden("X-Org-Id header required")
	}

	const org = await organizationRepository.findById(orgId)
	if (!org) {
		throw forbidden("Organization not found")
	}

	const member = await organizationRepository.getMember(orgId, user.id)
	if (!member) {
		throw forbidden("Not a member of this organization")
	}

	const plan = await getEffectivePlan(org)
	const orgContext: OrgContext = {
		id: org.id,
		plan,
		role: member.role,
		trialEndsAt: org.trialEndsAt,
	}

	c.set("org", orgContext)
	c.set("projectId", null)
	c.set("authMethod", "session")
	await next()
}

// Helper to get org context - throws if not set
export function getRequiredOrg(c: Context<AuthEnv>): OrgContext {
	const org = c.get("org")
	if (!org) {
		throw forbidden("Organization context required")
	}
	return org
}

// Helper to check if using API key auth
export function isApiKeyAuth(c: Context<AuthEnv>): boolean {
	return c.get("authMethod") === "api-key"
}

// Helper to get API key's project ID
export function getApiKeyProjectId(c: Context<AuthEnv>): string | null {
	return c.get("projectId")
}
