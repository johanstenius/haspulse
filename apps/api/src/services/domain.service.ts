import crypto from "node:crypto"
import { resolveTxt } from "node:dns/promises"
import { badRequest, conflict } from "../lib/errors.js"
import { projectRepository } from "../repositories/project.repository.js"
import type { ProjectModel } from "./project.service.js"

export type DomainVerificationResult = {
	verified: boolean
	expectedRecord: string
	foundRecords: string[]
}

function generateVerifyToken(): string {
	return `haspulse-verify=${crypto.randomBytes(16).toString("hex")}`
}

function getTxtRecordName(domain: string): string {
	return `_haspulse.${domain}`
}

export async function setCustomDomain(
	projectId: string,
	domain: string,
): Promise<ProjectModel> {
	const normalized = domain.toLowerCase().trim()

	if (
		!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
			normalized,
		)
	) {
		throw badRequest("Invalid domain format")
	}

	const existing = await projectRepository.findByCustomDomain(normalized)
	if (existing && existing.id !== projectId) {
		throw conflict("Domain already in use by another project")
	}

	const verifyToken = generateVerifyToken()
	return projectRepository.setCustomDomain(projectId, normalized, verifyToken)
}

export async function checkDomainVerification(
	project: ProjectModel,
): Promise<DomainVerificationResult> {
	if (!project.customDomain || !project.domainVerifyToken) {
		throw badRequest("No custom domain configured")
	}

	const txtRecordName = getTxtRecordName(project.customDomain)
	let foundRecords: string[] = []

	try {
		const records = await resolveTxt(txtRecordName)
		foundRecords = records.flat()
	} catch {
		// DNS lookup failed - no records found
	}

	const verified = foundRecords.includes(project.domainVerifyToken)

	return {
		verified,
		expectedRecord: project.domainVerifyToken,
		foundRecords,
	}
}

export async function verifyAndSaveDomain(
	project: ProjectModel,
): Promise<ProjectModel | null> {
	const result = await checkDomainVerification(project)
	if (result.verified) {
		return projectRepository.verifyDomain(project.id)
	}
	return null
}

export async function removeCustomDomain(
	projectId: string,
): Promise<ProjectModel> {
	return projectRepository.removeCustomDomain(projectId)
}

export async function getProjectByCustomDomain(
	domain: string,
): Promise<ProjectModel | null> {
	return projectRepository.findByCustomDomain(domain.toLowerCase())
}

export function getDomainInstructions(
	domain: string,
	verifyToken: string,
): {
	recordType: string
	recordName: string
	recordValue: string
} {
	return {
		recordType: "TXT",
		recordName: getTxtRecordName(domain),
		recordValue: verifyToken,
	}
}
