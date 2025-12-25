import { prisma } from "@haspulse/db"
import type {
	CreateProjectInput,
	ProjectModel,
	UpdateProjectInput,
} from "../services/project.service.js"

function toProjectModel(project: {
	id: string
	orgId: string
	name: string
	slug: string
	timezone: string
	statusPageEnabled: boolean
	statusPageTitle: string | null
	statusPageLogoUrl: string | null
	customDomain: string | null
	domainVerified: boolean
	domainVerifyToken: string | null
	createdAt: Date
	updatedAt: Date
}): ProjectModel {
	return {
		id: project.id,
		orgId: project.orgId,
		name: project.name,
		slug: project.slug,
		timezone: project.timezone,
		statusPageEnabled: project.statusPageEnabled,
		statusPageTitle: project.statusPageTitle,
		statusPageLogoUrl: project.statusPageLogoUrl,
		customDomain: project.customDomain,
		domainVerified: project.domainVerified,
		domainVerifyToken: project.domainVerifyToken,
		createdAt: project.createdAt,
		updatedAt: project.updatedAt,
	}
}

export const projectRepository = {
	async create(input: CreateProjectInput): Promise<ProjectModel> {
		const project = await prisma.project.create({
			data: {
				orgId: input.orgId,
				name: input.name,
				slug: input.slug,
				timezone: input.timezone ?? "UTC",
			},
		})
		return toProjectModel(project)
	},

	async findById(id: string): Promise<ProjectModel | null> {
		const project = await prisma.project.findUnique({ where: { id } })
		return project ? toProjectModel(project) : null
	},

	async findBySlug(slug: string): Promise<ProjectModel | null> {
		const project = await prisma.project.findUnique({ where: { slug } })
		return project ? toProjectModel(project) : null
	},

	async findByOrgId(orgId: string): Promise<ProjectModel[]> {
		const projects = await prisma.project.findMany({
			where: { orgId },
			orderBy: { createdAt: "desc" },
		})
		return projects.map(toProjectModel)
	},

	async findByOrgIdPaginated(
		orgId: string,
		page: number,
		limit: number,
	): Promise<{ data: ProjectModel[]; total: number }> {
		const [projects, total] = await Promise.all([
			prisma.project.findMany({
				where: { orgId },
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.project.count({ where: { orgId } }),
		])
		return { data: projects.map(toProjectModel), total }
	},

	async update(id: string, input: UpdateProjectInput): Promise<ProjectModel> {
		const project = await prisma.project.update({
			where: { id },
			data: input,
		})
		return toProjectModel(project)
	},

	async delete(id: string): Promise<void> {
		await prisma.project.delete({ where: { id } })
	},

	async slugExists(slug: string): Promise<boolean> {
		const count = await prisma.project.count({ where: { slug } })
		return count > 0
	},

	async countByOrgId(orgId: string): Promise<number> {
		return prisma.project.count({ where: { orgId } })
	},

	async findByCustomDomain(domain: string): Promise<ProjectModel | null> {
		const project = await prisma.project.findUnique({
			where: { customDomain: domain },
		})
		return project ? toProjectModel(project) : null
	},

	async setCustomDomain(
		id: string,
		domain: string,
		verifyToken: string,
	): Promise<ProjectModel> {
		const project = await prisma.project.update({
			where: { id },
			data: {
				customDomain: domain,
				domainVerified: false,
				domainVerifyToken: verifyToken,
			},
		})
		return toProjectModel(project)
	},

	async verifyDomain(id: string): Promise<ProjectModel> {
		const project = await prisma.project.update({
			where: { id },
			data: {
				domainVerified: true,
				domainVerifyToken: null,
			},
		})
		return toProjectModel(project)
	},

	async removeCustomDomain(id: string): Promise<ProjectModel> {
		const project = await prisma.project.update({
			where: { id },
			data: {
				customDomain: null,
				domainVerified: false,
				domainVerifyToken: null,
			},
		})
		return toProjectModel(project)
	},

	async customDomainExists(domain: string): Promise<boolean> {
		const count = await prisma.project.count({
			where: { customDomain: domain },
		})
		return count > 0
	},
}
