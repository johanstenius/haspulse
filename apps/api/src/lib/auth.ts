import { prisma } from "@haspulse/db"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { magicLink } from "better-auth/plugins"
import {
	renderMagicLinkEmail,
	renderPasswordResetEmail,
	renderVerificationEmail,
} from "../emails/index.js"
import { config } from "../env.js"
import { organizationRepository } from "../repositories/organization.repository.js"
import { sendTransactionalEmail } from "./sendpigeon.js"

function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}

async function generateUniqueSlug(baseName: string): Promise<string> {
	let slug = generateSlug(baseName)
	let counter = 1
	while (await organizationRepository.slugExists(slug)) {
		slug = `${generateSlug(baseName)}-${counter}`
		counter++
	}
	return slug
}

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	secret: config.authSecret,
	baseURL: config.apiUrl,
	basePath: "/auth",
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, token }) => {
			const resetUrl = `${config.appUrl}/auth/reset-password?token=${token}`
			await sendTransactionalEmail({
				to: user.email,
				subject: "Reset your Haspulse password",
				html: await renderPasswordResetEmail(resetUrl),
			})
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, token }) => {
			const verifyUrl = `${config.appUrl}/auth/verify-callback?token=${token}`
			await sendTransactionalEmail({
				to: user.email,
				subject: "Verify your Haspulse email",
				html: await renderVerificationEmail(verifyUrl),
			})
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
	},
	socialProviders: {
		google: {
			clientId: config.googleClientId ?? "",
			clientSecret: config.googleClientSecret ?? "",
			enabled: !!config.googleClientId && !!config.googleClientSecret,
		},
		github: {
			clientId: config.githubClientId ?? "",
			clientSecret: config.githubClientSecret ?? "",
			enabled: !!config.githubClientId && !!config.githubClientSecret,
		},
	},
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, token }) => {
				const magicUrl = `${config.appUrl}/auth/magic-link?token=${token}`
				await sendTransactionalEmail({
					to: email,
					subject: "Sign in to Haspulse",
					html: await renderMagicLinkEmail(magicUrl),
				})
			},
		}),
	],
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
		},
	},
	trustedOrigins: [config.appUrl],
	advanced: {
		crossSubDomainCookies: {
			enabled: true,
			domain: new URL(config.appUrl).hostname,
		},
		useSecureCookies: config.nodeEnv === "production",
	},
	user: {
		additionalFields: {},
		changeEmail: { enabled: false },
		deleteUser: { enabled: false },
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					const email = user.email ?? ""
					const orgName = user.name ?? email.split("@")[0] ?? "My Organization"
					const slug = await generateUniqueSlug(orgName)
					const trialEndsAt = new Date()
					trialEndsAt.setDate(trialEndsAt.getDate() + 14)

					const org = await organizationRepository.create({
						name: orgName,
						slug,
						plan: "free",
						trialEndsAt,
					})
					await organizationRepository.addMember(org.id, user.id, "owner")
				},
			},
		},
	},
})

export type Auth = typeof auth
