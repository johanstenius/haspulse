import { render } from "@react-email/components"
import { createElement } from "react"
import { AlertEmail } from "./alert.js"
import { InvitationEmail } from "./invitation.js"
import { MagicLinkEmail } from "./magic-link.js"
import { PasswordResetEmail } from "./password-reset.js"
import { VerificationEmail } from "./verification.js"

export async function renderVerificationEmail(url: string): Promise<string> {
	return render(createElement(VerificationEmail, { url }))
}

export async function renderPasswordResetEmail(url: string): Promise<string> {
	return render(createElement(PasswordResetEmail, { url }))
}

export async function renderMagicLinkEmail(url: string): Promise<string> {
	return render(createElement(MagicLinkEmail, { url }))
}

type AlertEmailParams = {
	checkName: string
	projectName: string
	status: "DOWN" | "RECOVERED" | "STILL DOWN"
	lastPingAt: string | null
}

export async function renderAlertEmail(
	params: AlertEmailParams,
): Promise<string> {
	return render(createElement(AlertEmail, params))
}

type InvitationEmailParams = {
	orgName: string
	inviterName: string
	role: string
	url: string
}

export async function renderInvitationEmail(
	params: InvitationEmailParams,
): Promise<string> {
	return render(createElement(InvitationEmail, params))
}
