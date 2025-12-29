import type { MonitorStatus } from "@haspulse/db"
import { forbidden, notFound } from "../lib/errors.js"
import { httpMonitorRepository } from "../repositories/http-monitor.repository.js"

export type HttpMonitorModel = {
	id: string
	projectId: string
	name: string
	url: string
	method: string
	headers: Record<string, string> | null
	body: string | null
	timeout: number
	expectedStatus: number
	expectedBody: string | null
	interval: number
	graceSeconds: number
	status: MonitorStatus
	lastCheckedAt: Date | null
	lastResponseMs: number | null
	nextCheckAt: Date | null
	lastAlertAt: Date | null
	alertOnRecovery: boolean
	createdAt: Date
	updatedAt: Date
}

export type CreateHttpMonitorInput = {
	projectId: string
	name: string
	url: string
	method?: string
	headers?: Record<string, string>
	body?: string
	timeout?: number
	expectedStatus?: number
	expectedBody?: string
	interval?: number
	graceSeconds?: number
	alertOnRecovery?: boolean
}

export type UpdateHttpMonitorInput = {
	name?: string
	url?: string
	method?: string
	headers?: Record<string, string> | null
	body?: string | null
	timeout?: number
	expectedStatus?: number
	expectedBody?: string | null
	interval?: number
	graceSeconds?: number
	alertOnRecovery?: boolean
}

export async function getHttpMonitorById(
	id: string,
): Promise<HttpMonitorModel | null> {
	return httpMonitorRepository.findById(id)
}

export async function createHttpMonitor(
	input: CreateHttpMonitorInput,
): Promise<HttpMonitorModel> {
	return httpMonitorRepository.create(input)
}

export async function listHttpMonitorsByProject(
	projectId: string,
): Promise<HttpMonitorModel[]> {
	return httpMonitorRepository.findByProjectId(projectId)
}

export async function listHttpMonitorsByProjectPaginated(
	projectId: string,
	page: number,
	limit: number,
	filters?: { search?: string; status?: MonitorStatus },
): Promise<{ data: HttpMonitorModel[]; total: number }> {
	return httpMonitorRepository.findByProjectIdPaginated(
		projectId,
		page,
		limit,
		filters,
	)
}

export async function updateHttpMonitor(
	id: string,
	input: UpdateHttpMonitorInput,
): Promise<HttpMonitorModel> {
	return httpMonitorRepository.update(id, input)
}

export async function deleteHttpMonitor(id: string): Promise<void> {
	await httpMonitorRepository.delete(id)
}

export async function pauseHttpMonitor(id: string): Promise<HttpMonitorModel> {
	return httpMonitorRepository.pause(id)
}

export async function resumeHttpMonitor(id: string): Promise<HttpMonitorModel> {
	return httpMonitorRepository.resume(id)
}

export async function getHttpMonitorForProject(
	httpMonitorId: string,
	projectId: string,
): Promise<HttpMonitorModel> {
	const monitor = await httpMonitorRepository.findById(httpMonitorId)
	if (!monitor) {
		throw notFound("HTTP monitor not found")
	}
	if (monitor.projectId !== projectId) {
		throw forbidden("HTTP monitor does not belong to this project")
	}
	return monitor
}

export async function getHttpMonitorChannelIds(
	httpMonitorId: string,
): Promise<string[]> {
	return httpMonitorRepository.getChannelIds(httpMonitorId)
}

export async function setHttpMonitorChannelIds(
	httpMonitorId: string,
	channelIds: string[],
): Promise<void> {
	await httpMonitorRepository.setChannelIds(httpMonitorId, channelIds)
}
