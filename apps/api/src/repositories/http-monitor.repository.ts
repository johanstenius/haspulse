import { MonitorStatus, Prisma, prisma } from "@haspulse/db"
import type { HttpMonitorModel } from "../services/http-monitor.service.js"

type CreateHttpMonitorData = {
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

type UpdateHttpMonitorData = {
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

function toHttpMonitorModel(monitor: {
	id: string
	projectId: string
	name: string
	url: string
	method: string
	headers: unknown
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
}): HttpMonitorModel {
	return {
		id: monitor.id,
		projectId: monitor.projectId,
		name: monitor.name,
		url: monitor.url,
		method: monitor.method,
		headers: monitor.headers as Record<string, string> | null,
		body: monitor.body,
		timeout: monitor.timeout,
		expectedStatus: monitor.expectedStatus,
		expectedBody: monitor.expectedBody,
		interval: monitor.interval,
		graceSeconds: monitor.graceSeconds,
		status: monitor.status,
		lastCheckedAt: monitor.lastCheckedAt,
		lastResponseMs: monitor.lastResponseMs,
		nextCheckAt: monitor.nextCheckAt,
		lastAlertAt: monitor.lastAlertAt,
		alertOnRecovery: monitor.alertOnRecovery,
		createdAt: monitor.createdAt,
		updatedAt: monitor.updatedAt,
	}
}

export const httpMonitorRepository = {
	async existsById(id: string): Promise<boolean> {
		const count = await prisma.httpMonitor.count({ where: { id } })
		return count > 0
	},

	async findById(id: string): Promise<HttpMonitorModel | null> {
		const monitor = await prisma.httpMonitor.findUnique({ where: { id } })
		return monitor ? toHttpMonitorModel(monitor) : null
	},

	async create(data: CreateHttpMonitorData): Promise<HttpMonitorModel> {
		const monitor = await prisma.httpMonitor.create({
			data: {
				projectId: data.projectId,
				name: data.name,
				url: data.url,
				method: data.method ?? "GET",
				headers: data.headers ?? undefined,
				body: data.body,
				timeout: data.timeout ?? 30,
				expectedStatus: data.expectedStatus ?? 200,
				expectedBody: data.expectedBody,
				interval: data.interval ?? 60,
				graceSeconds: data.graceSeconds ?? 60,
				alertOnRecovery: data.alertOnRecovery ?? true,
			},
		})
		return toHttpMonitorModel(monitor)
	},

	async findByProjectId(projectId: string): Promise<HttpMonitorModel[]> {
		const monitors = await prisma.httpMonitor.findMany({
			where: { projectId },
			orderBy: { createdAt: "desc" },
		})
		return monitors.map(toHttpMonitorModel)
	},

	async findByProjectIdPaginated(
		projectId: string,
		page: number,
		limit: number,
		filters?: { search?: string; status?: MonitorStatus },
	): Promise<{ data: HttpMonitorModel[]; total: number }> {
		const where: {
			projectId: string
			status?: MonitorStatus
			OR?: Array<
				| { name: { contains: string; mode: "insensitive" } }
				| { url: { contains: string; mode: "insensitive" } }
			>
		} = { projectId }

		if (filters?.status) {
			where.status = filters.status
		}

		if (filters?.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: "insensitive" } },
				{ url: { contains: filters.search, mode: "insensitive" } },
			]
		}

		const [monitors, total] = await Promise.all([
			prisma.httpMonitor.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.httpMonitor.count({ where }),
		])
		return { data: monitors.map(toHttpMonitorModel), total }
	},

	async update(
		id: string,
		data: UpdateHttpMonitorData,
	): Promise<HttpMonitorModel> {
		// Handle null JSON values for Prisma
		const updateData: Prisma.HttpMonitorUpdateInput = {
			...data,
			headers:
				data.headers === null
					? Prisma.JsonNull
					: data.headers === undefined
						? undefined
						: data.headers,
		}
		const monitor = await prisma.httpMonitor.update({
			where: { id },
			data: updateData,
		})
		return toHttpMonitorModel(monitor)
	},

	async delete(id: string): Promise<void> {
		await prisma.httpMonitor.delete({ where: { id } })
	},

	async pause(id: string): Promise<HttpMonitorModel> {
		const monitor = await prisma.httpMonitor.update({
			where: { id },
			data: { status: MonitorStatus.PAUSED },
		})
		return toHttpMonitorModel(monitor)
	},

	async resume(id: string): Promise<HttpMonitorModel> {
		const now = new Date()
		const monitor = await prisma.httpMonitor.update({
			where: { id },
			data: {
				status: MonitorStatus.NEW,
				nextCheckAt: now, // Check immediately on resume
			},
		})
		return toHttpMonitorModel(monitor)
	},

	async findDueForPolling(now: Date): Promise<HttpMonitorModel[]> {
		const monitors = await prisma.httpMonitor.findMany({
			where: {
				status: { not: MonitorStatus.PAUSED },
				OR: [{ nextCheckAt: null }, { nextCheckAt: { lte: now } }],
			},
		})
		return monitors.map(toHttpMonitorModel)
	},

	async updateAfterPoll(
		id: string,
		data: {
			success: boolean
			statusCode?: number
			responseMs?: number
			nextCheckAt: Date
		},
	): Promise<{ wasDown: boolean; monitor: HttpMonitorModel }> {
		const monitor = await prisma.httpMonitor.findUnique({
			where: { id },
		})
		if (!monitor) {
			throw new Error(`HttpMonitor not found: ${id}`)
		}

		const wasDown = monitor.status === MonitorStatus.DOWN

		const updateData: {
			lastCheckedAt: Date
			lastResponseMs?: number
			nextCheckAt: Date
			status?: MonitorStatus
		} = {
			lastCheckedAt: new Date(),
			nextCheckAt: data.nextCheckAt,
		}

		if (data.responseMs !== undefined) {
			updateData.lastResponseMs = data.responseMs
		}

		// Update status based on result
		if (data.success) {
			if (
				monitor.status === MonitorStatus.DOWN ||
				monitor.status === MonitorStatus.NEW ||
				monitor.status === MonitorStatus.LATE
			) {
				updateData.status = MonitorStatus.UP
			}
		} else {
			// Failed poll
			if (
				monitor.status === MonitorStatus.UP ||
				monitor.status === MonitorStatus.NEW
			) {
				updateData.status = MonitorStatus.LATE
			}
		}

		const updated = await prisma.httpMonitor.update({
			where: { id },
			data: updateData,
		})

		return { wasDown, monitor: toHttpMonitorModel(updated) }
	},

	async findLateMonitors(now: Date): Promise<HttpMonitorModel[]> {
		const monitors = await prisma.httpMonitor.findMany({
			where: {
				status: MonitorStatus.LATE,
			},
		})
		// Check if grace period exceeded
		return monitors
			.filter((m) => {
				if (!m.lastCheckedAt) return false
				const graceEnd = new Date(
					m.lastCheckedAt.getTime() + m.graceSeconds * 1000,
				)
				return now > graceEnd
			})
			.map(toHttpMonitorModel)
	},

	async updateStatus(id: string, status: MonitorStatus): Promise<void> {
		await prisma.httpMonitor.update({
			where: { id },
			data: { status },
		})
	},

	async updateLastAlertAt(id: string, timestamp: Date): Promise<void> {
		await prisma.httpMonitor.update({
			where: { id },
			data: { lastAlertAt: timestamp },
		})
	},

	async getChannelIds(httpMonitorId: string): Promise<string[]> {
		const relations = await prisma.httpMonitorChannel.findMany({
			where: { httpMonitorId },
			select: { channelId: true },
		})
		return relations.map((r) => r.channelId)
	},

	async setChannelIds(
		httpMonitorId: string,
		channelIds: string[],
	): Promise<void> {
		await prisma.$transaction([
			prisma.httpMonitorChannel.deleteMany({ where: { httpMonitorId } }),
			prisma.httpMonitorChannel.createMany({
				data: channelIds.map((channelId) => ({ httpMonitorId, channelId })),
			}),
		])
	},

	async recordPollResult(data: {
		httpMonitorId: string
		success: boolean
		statusCode?: number
		responseMs?: number
		error?: string
	}): Promise<void> {
		await prisma.httpPollResult.create({
			data: {
				httpMonitorId: data.httpMonitorId,
				success: data.success,
				statusCode: data.statusCode,
				responseMs: data.responseMs,
				error: data.error,
			},
		})
	},

	async findRecentPollResults(
		httpMonitorId: string,
		limit: number,
	): Promise<
		Array<{
			id: string
			success: boolean
			statusCode: number | null
			responseMs: number | null
			error: string | null
			createdAt: Date
		}>
	> {
		return prisma.httpPollResult.findMany({
			where: { httpMonitorId },
			orderBy: { createdAt: "desc" },
			take: limit,
		})
	},

	async findRecentPollResultsByMonitorIds(
		monitorIds: string[],
		limit: number,
	): Promise<
		Map<
			string,
			Array<{
				success: boolean
				createdAt: Date
			}>
		>
	> {
		if (monitorIds.length === 0) return new Map()

		const results = await prisma.httpPollResult.findMany({
			where: { httpMonitorId: { in: monitorIds } },
			orderBy: { createdAt: "desc" },
			select: {
				httpMonitorId: true,
				success: true,
				createdAt: true,
			},
		})

		const map = new Map<string, Array<{ success: boolean; createdAt: Date }>>()
		for (const monitorId of monitorIds) {
			map.set(monitorId, [])
		}
		for (const result of results) {
			const existing = map.get(result.httpMonitorId)
			if (existing && existing.length < limit) {
				existing.push({ success: result.success, createdAt: result.createdAt })
			}
		}
		return map
	},
}
