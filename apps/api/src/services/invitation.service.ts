import { randomBytes } from "node:crypto"
import { renderInvitationEmail } from "../emails/index.js"
import { config } from "../env.js"
import { badRequest, forbidden, notFound } from "../lib/errors.js"
import { sendTransactionalEmail } from "../lib/sendpigeon.js"
import {
	type InvitationModel,
	invitationRepository,
} from "../repositories/invitation.repository.js"
import { organizationRepository } from "../repositories/organization.repository.js"

export type { InvitationModel }

const INVITE_EXPIRY_DAYS = 7

function generateToken(): string {
	return randomBytes(32).toString("hex")
}

function getExpiryDate(): Date {
	const date = new Date()
	date.setDate(date.getDate() + INVITE_EXPIRY_DAYS)
	return date
}

export async function createInvitation(
	orgId: string,
	email: string,
	role: string,
	inviterName: string,
): Promise<InvitationModel> {
	const normalizedEmail = email.toLowerCase().trim()

	// Check if user is already a member
	const org = await organizationRepository.findById(orgId)
	if (!org) {
		throw notFound("Organization not found")
	}

	// Check for existing pending invite
	const existingInvite = await invitationRepository.findByOrgIdAndEmail(
		orgId,
		normalizedEmail,
	)
	if (existingInvite) {
		throw badRequest("Invitation already sent to this email")
	}

	// Check if email is already a member (need to check via user email)
	const members = await organizationRepository.getMembers(orgId)
	// We'd need to fetch user emails here - for now we skip this check
	// TODO: Add check for existing member by email

	const token = generateToken()
	const expiresAt = getExpiryDate()

	const invitation = await invitationRepository.create({
		email: normalizedEmail,
		orgId,
		role,
		token,
		expiresAt,
	})

	// Send invite email
	const inviteUrl = `${config.appUrl}/invite/accept?token=${token}`
	const html = await renderInvitationEmail({
		orgName: org.name,
		inviterName,
		role,
		url: inviteUrl,
	})

	await sendTransactionalEmail({
		to: normalizedEmail,
		subject: `You've been invited to join ${org.name} on Haspulse`,
		html,
	})

	return invitation
}

export async function acceptInvitation(
	token: string,
	userId: string,
): Promise<{ orgId: string; role: string }> {
	const invitation = await invitationRepository.findByToken(token)

	if (!invitation) {
		throw notFound("Invitation not found")
	}

	if (invitation.acceptedAt) {
		throw badRequest("Invitation has already been accepted")
	}

	if (invitation.expiresAt < new Date()) {
		throw badRequest("Invitation has expired")
	}

	// Check if user is already a member
	const existingMember = await organizationRepository.getMember(
		invitation.orgId,
		userId,
	)
	if (existingMember) {
		// Mark invitation as accepted anyway
		await invitationRepository.markAccepted(invitation.id)
		return { orgId: invitation.orgId, role: existingMember.role }
	}

	// Add user to org
	await organizationRepository.addMember(
		invitation.orgId,
		userId,
		invitation.role,
	)

	// Mark invitation as accepted
	await invitationRepository.markAccepted(invitation.id)

	return { orgId: invitation.orgId, role: invitation.role }
}

export async function listPendingInvitations(
	orgId: string,
): Promise<InvitationModel[]> {
	return invitationRepository.findPendingByOrgId(orgId)
}

export async function cancelInvitation(
	orgId: string,
	invitationId: string,
): Promise<void> {
	const invitation = await invitationRepository.findById(invitationId)

	if (!invitation) {
		throw notFound("Invitation not found")
	}

	if (invitation.orgId !== orgId) {
		throw forbidden("Invitation does not belong to this organization")
	}

	await invitationRepository.delete(invitationId)
}

export async function resendInvitation(
	orgId: string,
	invitationId: string,
	inviterName: string,
): Promise<InvitationModel> {
	const invitation = await invitationRepository.findById(invitationId)

	if (!invitation) {
		throw notFound("Invitation not found")
	}

	if (invitation.orgId !== orgId) {
		throw forbidden("Invitation does not belong to this organization")
	}

	if (invitation.acceptedAt) {
		throw badRequest("Invitation has already been accepted")
	}

	const org = await organizationRepository.findById(orgId)
	if (!org) {
		throw notFound("Organization not found")
	}

	// Refresh expiry
	const newExpiry = getExpiryDate()
	const updated = await invitationRepository.updateExpiry(
		invitationId,
		newExpiry,
	)

	// Resend email
	const inviteUrl = `${config.appUrl}/invite/accept?token=${invitation.token}`
	const html = await renderInvitationEmail({
		orgName: org.name,
		inviterName,
		role: invitation.role,
		url: inviteUrl,
	})

	await sendTransactionalEmail({
		to: invitation.email,
		subject: `Reminder: You've been invited to join ${org.name} on Haspulse`,
		html,
	})

	return updated
}

export async function getInvitationByToken(
	token: string,
): Promise<InvitationModel | null> {
	return invitationRepository.findByToken(token)
}
