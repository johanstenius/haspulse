import { prisma } from "@haspulse/db"

export type InvitationModel = {
	id: string
	email: string
	orgId: string
	role: string
	token: string
	expiresAt: Date
	acceptedAt: Date | null
	createdAt: Date
}

export type CreateInvitationInput = {
	email: string
	orgId: string
	role: string
	token: string
	expiresAt: Date
}

function toInvitationModel(invitation: {
	id: string
	email: string
	orgId: string
	role: string
	token: string
	expiresAt: Date
	acceptedAt: Date | null
	createdAt: Date
}): InvitationModel {
	return {
		id: invitation.id,
		email: invitation.email,
		orgId: invitation.orgId,
		role: invitation.role,
		token: invitation.token,
		expiresAt: invitation.expiresAt,
		acceptedAt: invitation.acceptedAt,
		createdAt: invitation.createdAt,
	}
}

export const invitationRepository = {
	async create(input: CreateInvitationInput): Promise<InvitationModel> {
		const invitation = await prisma.invitation.create({
			data: {
				email: input.email,
				orgId: input.orgId,
				role: input.role,
				token: input.token,
				expiresAt: input.expiresAt,
			},
		})
		return toInvitationModel(invitation)
	},

	async findById(id: string): Promise<InvitationModel | null> {
		const invitation = await prisma.invitation.findUnique({ where: { id } })
		return invitation ? toInvitationModel(invitation) : null
	},

	async findByToken(token: string): Promise<InvitationModel | null> {
		const invitation = await prisma.invitation.findUnique({ where: { token } })
		return invitation ? toInvitationModel(invitation) : null
	},

	async findPendingByOrgId(orgId: string): Promise<InvitationModel[]> {
		const invitations = await prisma.invitation.findMany({
			where: {
				orgId,
				acceptedAt: null,
				expiresAt: { gt: new Date() },
			},
			orderBy: { createdAt: "desc" },
		})
		return invitations.map(toInvitationModel)
	},

	async findPendingByEmail(email: string): Promise<InvitationModel[]> {
		const invitations = await prisma.invitation.findMany({
			where: {
				email: email.toLowerCase(),
				acceptedAt: null,
				expiresAt: { gt: new Date() },
			},
			orderBy: { createdAt: "desc" },
		})
		return invitations.map(toInvitationModel)
	},

	async findByOrgIdAndEmail(
		orgId: string,
		email: string,
	): Promise<InvitationModel | null> {
		const invitation = await prisma.invitation.findFirst({
			where: {
				orgId,
				email: email.toLowerCase(),
				acceptedAt: null,
				expiresAt: { gt: new Date() },
			},
		})
		return invitation ? toInvitationModel(invitation) : null
	},

	async markAccepted(id: string): Promise<InvitationModel> {
		const invitation = await prisma.invitation.update({
			where: { id },
			data: { acceptedAt: new Date() },
		})
		return toInvitationModel(invitation)
	},

	async updateExpiry(id: string, expiresAt: Date): Promise<InvitationModel> {
		const invitation = await prisma.invitation.update({
			where: { id },
			data: { expiresAt },
		})
		return toInvitationModel(invitation)
	},

	async delete(id: string): Promise<void> {
		await prisma.invitation.delete({ where: { id } })
	},

	async deleteExpired(): Promise<number> {
		const result = await prisma.invitation.deleteMany({
			where: {
				expiresAt: { lt: new Date() },
				acceptedAt: null,
			},
		})
		return result.count
	},
}
