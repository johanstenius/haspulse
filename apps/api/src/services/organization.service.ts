import { forbidden, notFound } from "../lib/errors.js"
import {
	type OrgMemberModel,
	type OrgModel,
	organizationRepository,
} from "../repositories/organization.repository.js"

export type { OrgModel, OrgMemberModel }

export type CreateOrgInput = {
	name: string
	slug: string
	ownerId: string
}

export type UpdateOrgInput = {
	name?: string
	slug?: string
}

function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}

export async function createOrganization(
	input: CreateOrgInput,
): Promise<OrgModel> {
	const trialEndsAt = new Date()
	trialEndsAt.setDate(trialEndsAt.getDate() + 14)

	const org = await organizationRepository.create({
		name: input.name,
		slug: input.slug,
		plan: "free",
		trialEndsAt,
	})

	await organizationRepository.addMember(org.id, input.ownerId, "owner")

	return org
}

export async function getOrganizationById(
	id: string,
): Promise<OrgModel | null> {
	return organizationRepository.findById(id)
}

export async function getOrganizationBySlug(
	slug: string,
): Promise<OrgModel | null> {
	return organizationRepository.findBySlug(slug)
}

export async function listOrganizationsByUser(
	userId: string,
): Promise<OrgModel[]> {
	return organizationRepository.findByUserId(userId)
}

export async function updateOrganization(
	id: string,
	input: UpdateOrgInput,
): Promise<OrgModel> {
	return organizationRepository.update(id, input)
}

export async function deleteOrganization(id: string): Promise<void> {
	await organizationRepository.delete(id)
}

export async function getOrgForUser(
	orgId: string,
	userId: string,
): Promise<OrgModel> {
	const org = await organizationRepository.findById(orgId)
	if (!org) {
		throw notFound("Organization not found")
	}
	const member = await organizationRepository.getMember(orgId, userId)
	if (!member) {
		throw forbidden("Not a member of this organization")
	}
	return org
}

export async function requireOrgRole(
	orgId: string,
	userId: string,
	requiredRoles: string[],
): Promise<OrgMemberModel> {
	const member = await organizationRepository.getMember(orgId, userId)
	if (!member) {
		throw forbidden("Not a member of this organization")
	}
	if (!requiredRoles.includes(member.role)) {
		throw forbidden("Insufficient permissions")
	}
	return member
}

export async function slugExists(slug: string): Promise<boolean> {
	return organizationRepository.slugExists(slug)
}

export async function generateUniqueSlug(baseName: string): Promise<string> {
	let slug = generateSlug(baseName)
	let counter = 1
	while (await organizationRepository.slugExists(slug)) {
		slug = `${generateSlug(baseName)}-${counter}`
		counter++
	}
	return slug
}

export async function getOrgMembers(orgId: string): Promise<OrgMemberModel[]> {
	return organizationRepository.getMembers(orgId)
}

export async function addOrgMember(
	orgId: string,
	userId: string,
	role = "member",
): Promise<OrgMemberModel> {
	return organizationRepository.addMember(orgId, userId, role)
}

export async function removeOrgMember(
	orgId: string,
	userId: string,
): Promise<void> {
	await organizationRepository.removeMember(orgId, userId)
}

export async function updateOrgMemberRole(
	orgId: string,
	userId: string,
	role: string,
): Promise<OrgMemberModel> {
	return organizationRepository.updateMemberRole(orgId, userId, role)
}

export async function isOrgTrialActive(org: OrgModel): Promise<boolean> {
	if (!org.trialEndsAt) return false
	return org.trialEndsAt > new Date()
}

export async function getEffectivePlan(org: OrgModel): Promise<"free" | "pro"> {
	if (org.plan === "pro") return "pro"
	if (org.trialEndsAt && org.trialEndsAt > new Date()) return "pro"
	return "free"
}

export type UsageStats = {
	projectCount: number
	totalChecks: number
}

export async function getUsageStats(orgId: string): Promise<UsageStats> {
	const [projectCount, totalChecks] = await Promise.all([
		organizationRepository.countProjectsByOrg(orgId),
		organizationRepository.countChecksByOrg(orgId),
	])
	return { projectCount, totalChecks }
}
