import { forbidden, notFound } from "../lib/errors.js"
import { projectRepository } from "../repositories/project.repository.js"

export type ProjectModel = {
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
}

export type CreateProjectInput = {
	orgId: string
	name: string
	slug: string
	timezone?: string
}

export type UpdateProjectInput = {
	name?: string
	slug?: string
	timezone?: string
	statusPageEnabled?: boolean
	statusPageTitle?: string | null
	statusPageLogoUrl?: string | null
}

export async function createProject(
	input: CreateProjectInput,
): Promise<ProjectModel> {
	return projectRepository.create(input)
}

export async function getProjectById(id: string): Promise<ProjectModel | null> {
	return projectRepository.findById(id)
}

export async function getProjectBySlug(
	slug: string,
): Promise<ProjectModel | null> {
	return projectRepository.findBySlug(slug)
}

export async function listProjectsByOrg(
	orgId: string,
): Promise<ProjectModel[]> {
	return projectRepository.findByOrgId(orgId)
}

export async function listProjectsByOrgPaginated(
	orgId: string,
	page: number,
	limit: number,
): Promise<{ data: ProjectModel[]; total: number }> {
	return projectRepository.findByOrgIdPaginated(orgId, page, limit)
}

export async function updateProject(
	id: string,
	input: UpdateProjectInput,
): Promise<ProjectModel> {
	return projectRepository.update(id, input)
}

export async function deleteProject(id: string): Promise<void> {
	await projectRepository.delete(id)
}

export async function getProjectForOrg(
	projectId: string,
	orgId: string,
): Promise<ProjectModel> {
	const project = await projectRepository.findById(projectId)
	if (!project) {
		throw notFound("Project not found")
	}
	if (project.orgId !== orgId) {
		throw forbidden("Project does not belong to this organization")
	}
	return project
}

export async function slugExists(slug: string): Promise<boolean> {
	return projectRepository.slugExists(slug)
}

export async function countProjectsByOrg(orgId: string): Promise<number> {
	return projectRepository.countByOrgId(orgId)
}
