import { prisma } from "@haspulse/db"

export type OrgModel = {
	id: string
	name: string
	slug: string
	plan: string
	stripeCustomerId: string | null
	stripeSubscriptionId: string | null
	trialEndsAt: Date | null
	autoCreateIncidents: boolean
	createdAt: Date
	updatedAt: Date
}

export type OrgMemberModel = {
	id: string
	role: string
	userId: string
	orgId: string
	createdAt: Date
}

export type CreateOrgInput = {
	name: string
	slug: string
	plan?: string
	trialEndsAt?: Date
}

export type UpdateOrgInput = {
	name?: string
	slug?: string
	plan?: string
	stripeCustomerId?: string | null
	stripeSubscriptionId?: string | null
	trialEndsAt?: Date | null
	autoCreateIncidents?: boolean
}

function toOrgModel(org: {
	id: string
	name: string
	slug: string
	plan: string
	stripeCustomerId: string | null
	stripeSubscriptionId: string | null
	trialEndsAt: Date | null
	autoCreateIncidents: boolean
	createdAt: Date
	updatedAt: Date
}): OrgModel {
	return {
		id: org.id,
		name: org.name,
		slug: org.slug,
		plan: org.plan,
		stripeCustomerId: org.stripeCustomerId,
		stripeSubscriptionId: org.stripeSubscriptionId,
		trialEndsAt: org.trialEndsAt,
		autoCreateIncidents: org.autoCreateIncidents,
		createdAt: org.createdAt,
		updatedAt: org.updatedAt,
	}
}

function toMemberModel(member: {
	id: string
	role: string
	userId: string
	orgId: string
	createdAt: Date
}): OrgMemberModel {
	return {
		id: member.id,
		role: member.role,
		userId: member.userId,
		orgId: member.orgId,
		createdAt: member.createdAt,
	}
}

export const organizationRepository = {
	async create(input: CreateOrgInput): Promise<OrgModel> {
		const org = await prisma.organization.create({
			data: {
				name: input.name,
				slug: input.slug,
				plan: input.plan ?? "free",
				trialEndsAt: input.trialEndsAt,
			},
		})
		return toOrgModel(org)
	},

	async findById(id: string): Promise<OrgModel | null> {
		const org = await prisma.organization.findUnique({ where: { id } })
		return org ? toOrgModel(org) : null
	},

	async findBySlug(slug: string): Promise<OrgModel | null> {
		const org = await prisma.organization.findUnique({ where: { slug } })
		return org ? toOrgModel(org) : null
	},

	async findByStripeCustomerId(customerId: string): Promise<OrgModel | null> {
		const org = await prisma.organization.findUnique({
			where: { stripeCustomerId: customerId },
		})
		return org ? toOrgModel(org) : null
	},

	async findByUserId(userId: string): Promise<OrgModel[]> {
		const memberships = await prisma.orgMember.findMany({
			where: { userId },
			include: { org: true },
			orderBy: { createdAt: "desc" },
		})
		return memberships.map((m) => toOrgModel(m.org))
	},

	async update(id: string, input: UpdateOrgInput): Promise<OrgModel> {
		const org = await prisma.organization.update({
			where: { id },
			data: input,
		})
		return toOrgModel(org)
	},

	async delete(id: string): Promise<void> {
		await prisma.organization.delete({ where: { id } })
	},

	async slugExists(slug: string): Promise<boolean> {
		const count = await prisma.organization.count({ where: { slug } })
		return count > 0
	},

	async addMember(
		orgId: string,
		userId: string,
		role = "member",
	): Promise<OrgMemberModel> {
		const member = await prisma.orgMember.create({
			data: { orgId, userId, role },
		})
		return toMemberModel(member)
	},

	async removeMember(orgId: string, userId: string): Promise<void> {
		await prisma.orgMember.delete({
			where: { userId_orgId: { userId, orgId } },
		})
	},

	async getMember(
		orgId: string,
		userId: string,
	): Promise<OrgMemberModel | null> {
		const member = await prisma.orgMember.findUnique({
			where: { userId_orgId: { userId, orgId } },
		})
		return member ? toMemberModel(member) : null
	},

	async getMembers(orgId: string): Promise<OrgMemberModel[]> {
		const members = await prisma.orgMember.findMany({
			where: { orgId },
			orderBy: { createdAt: "asc" },
		})
		return members.map(toMemberModel)
	},

	async updateMemberRole(
		orgId: string,
		userId: string,
		role: string,
	): Promise<OrgMemberModel> {
		const member = await prisma.orgMember.update({
			where: { userId_orgId: { userId, orgId } },
			data: { role },
		})
		return toMemberModel(member)
	},

	async countByUserId(userId: string): Promise<number> {
		return prisma.orgMember.count({ where: { userId } })
	},

	async countProjectsByOrg(orgId: string): Promise<number> {
		return prisma.project.count({ where: { orgId } })
	},

	async countChecksByOrg(orgId: string): Promise<number> {
		return prisma.check.count({ where: { project: { orgId } } })
	},

	async countChannelsByProject(projectId: string): Promise<number> {
		return prisma.channel.count({ where: { projectId } })
	},

	async countApiKeysByProject(projectId: string): Promise<number> {
		return prisma.apiKey.count({ where: { projectId } })
	},

	async isMemberByEmail(orgId: string, email: string): Promise<boolean> {
		const member = await prisma.orgMember.findFirst({
			where: {
				orgId,
				user: { email: email.toLowerCase() },
			},
		})
		return member !== null
	},

	async findByCheckId(checkId: string): Promise<OrgModel | null> {
		const check = await prisma.check.findUnique({
			where: { id: checkId },
			include: { project: { include: { org: true } } },
		})
		return check?.project?.org ? toOrgModel(check.project.org) : null
	},
}
