const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

// Organization types
export type Organization = {
	id: string
	name: string
	slug: string
	plan: "free" | "pro"
	createdAt: string
	updatedAt: string
}

export type OrgMember = {
	id: string
	role: "owner" | "admin" | "member"
	userId: string
	orgId: string
	createdAt: string
}

export type BillingInfo = {
	plan: string
	displayName: string
	isTrialing: boolean
	trialEndsAt: string | null
	usage: {
		cronJobs: { current: number; limit: number | null }
		httpMonitors: { current: number; limit: number | null }
		projects: { current: number; limit: number | null }
	}
}

export function setCurrentOrgId(orgId: string | null): void {
	if (typeof window === "undefined") return
	if (orgId) {
		localStorage.setItem("currentOrgId", orgId)
	} else {
		localStorage.removeItem("currentOrgId")
	}
}

export function getCurrentOrgId(): string | null {
	if (typeof window === "undefined") return null
	return localStorage.getItem("currentOrgId")
}

export type Project = {
	id: string
	name: string
	slug: string
	createdAt: string
	updatedAt: string
}

export type MonitorStatus = "NEW" | "UP" | "LATE" | "DOWN" | "PAUSED"
export type ScheduleType = "PERIOD" | "CRON"
export type AnomalySensitivity = "LOW" | "NORMAL" | "HIGH"

export type CronJobListParams = {
	page?: number
	limit?: number
	search?: string
	status?: MonitorStatus
}

export type CronJobListResponse = {
	cronJobs: CronJob[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export type PingType = "SUCCESS" | "START" | "FAIL"

export type SparklineSlot = "success" | "fail" | "missed" | "empty"

export type CronJob = {
	id: string
	projectId: string
	name: string
	slug: string | null
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds: number
	status: MonitorStatus
	lastPingAt: string | null
	lastStartedAt: string | null
	nextExpectedAt: string | null
	alertOnRecovery: boolean
	reminderIntervalHours: number | null
	anomalySensitivity: AnomalySensitivity
	channelIds: string[]
	sparkline: SparklineSlot[]
	createdAt: string
	updatedAt: string
}

// HTTP Monitor types
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD"

export type HttpMonitor = {
	id: string
	projectId: string
	name: string
	url: string
	method: HttpMethod
	headers: Record<string, string> | null
	body: string | null
	timeout: number
	expectedStatus: number
	expectedBody: string | null
	interval: number
	graceSeconds: number
	status: MonitorStatus
	lastCheckedAt: string | null
	lastResponseMs: number | null
	nextCheckAt: string | null
	alertOnRecovery: boolean
	channelIds: string[]
	sparkline: SparklineSlot[]
	createdAt: string
	updatedAt: string
}

export type HttpMonitorListParams = {
	page?: number
	limit?: number
	search?: string
	status?: MonitorStatus
}

export type HttpMonitorListResponse = {
	httpMonitors: HttpMonitor[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export type CreateHttpMonitorData = {
	name: string
	url: string
	method?: HttpMethod
	headers?: Record<string, string>
	body?: string
	timeout?: number
	expectedStatus?: number
	expectedBody?: string
	interval?: number
	graceSeconds?: number
	alertOnRecovery?: boolean
}

export type UpdateHttpMonitorData = {
	name?: string
	url?: string
	method?: HttpMethod
	headers?: Record<string, string> | null
	body?: string | null
	timeout?: number
	expectedStatus?: number
	expectedBody?: string | null
	interval?: number
	graceSeconds?: number
	alertOnRecovery?: boolean
	channelIds?: string[]
}

export type ChannelType =
	| "EMAIL"
	| "SLACK_WEBHOOK"
	| "SLACK_APP"
	| "DISCORD"
	| "PAGERDUTY"
	| "OPSGENIE"
	| "WEBHOOK"

export type Channel = {
	id: string
	projectId: string
	type: ChannelType
	name: string
	config: Record<string, unknown>
	isDefault: boolean
	createdAt: string
	updatedAt: string
}

export type ApiKey = {
	id: string
	projectId: string
	name: string
	keyPrefix: string
	lastUsedAt: string | null
	createdAt: string
}

export type ApiKeyCreated = {
	apiKey: ApiKey
	fullKey: string
}

export type Ping = {
	id: string
	cronJobId: string
	type: PingType
	body: string | null
	sourceIp: string
	createdAt: string
}

export type PingListParams = {
	page?: number
	limit?: number
}

export type PingsListResponse = {
	pings: Ping[]
	total: number
	page: number
	limit: number
	totalPages: number
}

// Status Page types
export type StatusPageTheme = "LIGHT" | "DARK" | "SYSTEM"

export type StatusPage = {
	id: string
	projectId: string
	slug: string
	name: string
	description: string | null
	logoUrl: string | null
	accentColor: string
	theme: StatusPageTheme
	customDomain: string | null
	domainVerified: boolean
	verifyToken: string | null
	showUptime: boolean
	uptimeDays: number
	autoIncidents: boolean
	createdAt: string
	updatedAt: string
}

export type StatusPageComponent = {
	id: string
	statusPageId: string
	cronJobId: string | null
	httpMonitorId: string | null
	displayName: string
	groupName: string | null
	sortOrder: number
	createdAt: string
	updatedAt: string
}

export type CreateStatusPageData = {
	slug: string
	name: string
	description?: string
	accentColor?: string
	theme?: StatusPageTheme
	showUptime?: boolean
	uptimeDays?: number
	autoIncidents?: boolean
}

export type UpdateStatusPageData = {
	slug?: string
	name?: string
	description?: string | null
	logoUrl?: string | null
	accentColor?: string
	theme?: StatusPageTheme
	customDomain?: string | null
	showUptime?: boolean
	uptimeDays?: number
	autoIncidents?: boolean
}

export type CreateComponentData = {
	cronJobId?: string
	httpMonitorId?: string
	displayName: string
	groupName?: string
}

export type UpdateComponentData = {
	displayName?: string
	groupName?: string | null
}

export type ComponentStatus =
	| "operational"
	| "degraded"
	| "partial_outage"
	| "major_outage"

export type UptimeDay = {
	date: string
	upPercent: number
}

export type PublicStatusPageComponent = {
	id: string
	displayName: string
	groupName: string | null
	status: ComponentStatus
	lastCheckedAt: string | null
	uptimeHistory: UptimeDay[]
}

// Incident types
export type IncidentStatus =
	| "INVESTIGATING"
	| "IDENTIFIED"
	| "MONITORING"
	| "RESOLVED"

export type IncidentSeverity = "MINOR" | "MAJOR" | "CRITICAL"

export type IncidentUpdate = {
	id: string
	status: IncidentStatus
	message: string
	createdAt: string
}

export type Incident = {
	id: string
	statusPageId: string
	title: string
	status: IncidentStatus
	severity: IncidentSeverity
	componentIds: string[]
	autoCreated: boolean
	sourceCronJobId: string | null
	sourceHttpMonitorId: string | null
	startsAt: string
	resolvedAt: string | null
	createdAt: string
	updatedAt: string
}

export type IncidentWithUpdates = Incident & {
	updates: IncidentUpdate[]
}

export type CreateIncidentData = {
	title: string
	severity: IncidentSeverity
	componentIds: string[]
	initialMessage?: string
}

export type UpdateIncidentData = {
	title?: string
	severity?: IncidentSeverity
	componentIds?: string[]
}

export type CreateIncidentUpdateData = {
	status: IncidentStatus
	message: string
}

// Maintenance types
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"

export type Maintenance = {
	id: string
	statusPageId: string
	title: string
	description: string | null
	componentIds: string[]
	scheduledFor: string
	expectedEnd: string
	status: MaintenanceStatus
	createdAt: string
	updatedAt: string
}

export type CreateMaintenanceData = {
	title: string
	description?: string
	componentIds: string[]
	scheduledFor: string
	expectedEnd: string
}

export type UpdateMaintenanceData = {
	title?: string
	description?: string | null
	componentIds?: string[]
	scheduledFor?: string
	expectedEnd?: string
	status?: MaintenanceStatus
}

// Public incident/maintenance types
export type PublicIncidentUpdate = {
	id: string
	status: IncidentStatus
	message: string
	createdAt: string
}

export type PublicIncident = {
	id: string
	title: string
	status: IncidentStatus
	severity: IncidentSeverity
	componentIds: string[]
	startsAt: string
	resolvedAt: string | null
	updates: PublicIncidentUpdate[]
}

export type PublicMaintenance = {
	id: string
	title: string
	description: string | null
	componentIds: string[]
	scheduledFor: string
	expectedEnd: string
	status: MaintenanceStatus
}

export type PublicStatusPage = {
	name: string
	description: string | null
	logoUrl: string | null
	accentColor: string
	theme: StatusPageTheme
	overallStatus: ComponentStatus
	components: PublicStatusPageComponent[]
	activeIncidents: PublicIncident[]
	recentIncidents: PublicIncident[]
	upcomingMaintenances: PublicMaintenance[]
}

export type ApiError = {
	error: {
		code: string
		message: string
	}
}

export type FetchError = {
	name: "FetchError"
	message: string
	status: number
	code: string
}

function createFetchError(status: number, data: ApiError): FetchError {
	return {
		name: "FetchError",
		message: data.error.message,
		status,
		code: data.error.code,
	}
}

export function isLimitExceeded(error: unknown): boolean {
	return isFetchError(error) && error.code === "LIMIT_EXCEEDED"
}

function isFetchError(error: unknown): error is FetchError {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		error.name === "FetchError"
	)
}

async function request<T>(
	path: string,
	options: RequestInit = {},
	includeOrg = true,
): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string>),
	}

	if (includeOrg) {
		const orgId = getCurrentOrgId()
		if (orgId) {
			headers["X-Org-Id"] = orgId
		}
	}

	const res = await fetch(`${API_URL}${path}`, {
		...options,
		credentials: "include",
		headers,
	})

	if (!res.ok) {
		const data = (await res.json()) as ApiError
		throw createFetchError(res.status, data)
	}

	// Handle 204 No Content
	if (res.status === 204) {
		return undefined as T
	}

	return res.json() as Promise<T>
}

function get<T>(path: string, includeOrg = true): Promise<T> {
	return request<T>(path, { method: "GET" }, includeOrg)
}

function post<T>(path: string, body: unknown, includeOrg = true): Promise<T> {
	return request<T>(
		path,
		{ method: "POST", body: JSON.stringify(body) },
		includeOrg,
	)
}

function patch<T>(path: string, body: unknown, includeOrg = true): Promise<T> {
	return request<T>(
		path,
		{ method: "PATCH", body: JSON.stringify(body) },
		includeOrg,
	)
}

function del<T = void>(path: string, includeOrg = true): Promise<T> {
	return request<T>(path, { method: "DELETE" }, includeOrg)
}

export type CreateProjectData = {
	name: string
	slug: string
}

export type UpdateProjectData = {
	name?: string
	slug?: string
}

export type CreateCronJobData = {
	name: string
	slug?: string
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds?: number
	alertOnRecovery?: boolean
	reminderIntervalHours?: number
	anomalySensitivity?: AnomalySensitivity
}

export type UpdateCronJobData = {
	name?: string
	slug?: string | null
	scheduleType?: ScheduleType
	scheduleValue?: string
	graceSeconds?: number
	alertOnRecovery?: boolean
	reminderIntervalHours?: number | null
	anomalySensitivity?: AnomalySensitivity
	channelIds?: string[]
}

export type CreateChannelData = {
	type: ChannelType
	name: string
	config: Record<string, unknown>
	isDefault?: boolean
}

export type UpdateChannelData = {
	name?: string
	config?: Record<string, unknown>
	isDefault?: boolean
}

export type CreateApiKeyData = {
	name: string
}

export type DashboardStats = {
	totalProjects: number
	totalCronJobs: number
	uptimePercent: number
	cronJobsByStatus: {
		UP: number
		DOWN: number
		LATE: number
		NEW: number
		PAUSED: number
	}
}

export type TrendDirection = "increasing" | "decreasing" | "stable" | "unknown"

export type DurationStats = {
	current: {
		avgMs: number | null
		p50Ms: number | null
		p95Ms: number | null
		p99Ms: number | null
		sampleCount: number
	} | null
	trend: {
		last5: number[]
		direction: TrendDirection
	}
	isAnomaly: boolean
}

export type DashboardCronJob = {
	id: string
	name: string
	status: MonitorStatus
	scheduleType: ScheduleType
	scheduleValue: string
	lastPingAt: string | null
	projectId: string
	projectName: string
	sparkline: SparklineSlot[]
}

export type CreateOrgData = {
	name: string
	slug: string
}

export type UpdateOrgData = {
	name?: string
	slug?: string
}

export type Invitation = {
	id: string
	email: string
	orgId: string
	role: string
	expiresAt: string
	createdAt: string
}

export type CreateInvitationData = {
	email: string
	role: "admin" | "member"
}

export type AcceptInvitationResult = {
	orgId: string
	role: string
}

// Alert types
export type AlertEvent =
	| "cronJob.down"
	| "cronJob.up"
	| "cronJob.still_down"
	| "cronJob.fail"

export type AlertChannel = {
	id: string
	name: string
	type: string
}

export type DurationContext = {
	lastDurationMs: number | null
	last5Durations: number[]
	avgDurationMs: number | null
	trendDirection: TrendDirection
	isAnomaly: boolean
	anomalyType?: "zscore" | "drift"
	zScore?: number
}

export type ErrorPatternContext = {
	lastErrorSnippet: string | null
	errorCount24h: number
}

export type CorrelationContext = {
	relatedFailures: Array<{
		cronJobId: string
		cronJobName: string
		failedAt: string
	}>
}

export type AlertContext = {
	duration?: DurationContext
	errorPattern?: ErrorPatternContext
	correlation?: CorrelationContext
}

export type Alert = {
	id: string
	cronJobId: string
	event: AlertEvent
	channels: AlertChannel[]
	context: AlertContext | null
	success: boolean
	error: string | null
	createdAt: string
}

export type AlertWithCronJob = Alert & {
	cronJobName: string
	projectId: string
	projectName: string
}

export type AlertFiltersParams = {
	page?: number
	limit?: number
	event?: AlertEvent
	fromDate?: string
	toDate?: string
}

export type AlertOrgFiltersParams = AlertFiltersParams & {
	projectId?: string
	cronJobId?: string
}

export type CronJobAlertsListResponse = {
	alerts: Alert[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export type AlertsListResponse = {
	alerts: AlertWithCronJob[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export const api = {
	organizations: {
		list: () =>
			get<{ organizations: Organization[] }>("/v1/organizations", false),
		get: (id: string) => get<Organization>(`/v1/organizations/${id}`, false),
		create: (data: CreateOrgData) =>
			post<Organization>("/v1/organizations", data, false),
		update: (id: string, data: UpdateOrgData) =>
			patch<Organization>(`/v1/organizations/${id}`, data, false),
		delete: (id: string) => del(`/v1/organizations/${id}`, false),
	},
	billing: {
		get: () => get<BillingInfo>("/v1/billing"),
		createCheckout: (successUrl: string, cancelUrl: string) =>
			post<{ url: string }>("/v1/billing/checkout", { successUrl, cancelUrl }),
		createPortal: (returnUrl: string) =>
			post<{ url: string }>("/v1/billing/portal", { returnUrl }),
	},
	dashboard: {
		stats: () => get<DashboardStats>("/v1/dashboard/stats"),
		cronJobs: () =>
			get<{ cronJobs: DashboardCronJob[] }>("/v1/dashboard/cron-jobs"),
	},
	projects: {
		list: () => get<{ projects: Project[] }>("/v1/projects"),
		get: (id: string) => get<Project>(`/v1/projects/${id}`),
		create: (data: CreateProjectData) => post<Project>("/v1/projects", data),
		update: (id: string, data: UpdateProjectData) =>
			patch<Project>(`/v1/projects/${id}`, data),
		delete: (id: string) => del(`/v1/projects/${id}`),
	},
	cronJobs: {
		list: (projectId: string, params?: CronJobListParams) => {
			const searchParams = new URLSearchParams()
			if (params?.page) searchParams.set("page", String(params.page))
			if (params?.limit) searchParams.set("limit", String(params.limit))
			if (params?.search) searchParams.set("search", params.search)
			if (params?.status) searchParams.set("status", params.status)
			const query = searchParams.toString()
			return get<CronJobListResponse>(
				`/v1/projects/${projectId}/cron-jobs${query ? `?${query}` : ""}`,
			)
		},
		get: (id: string) => get<CronJob>(`/v1/cron-jobs/${id}`),
		create: (projectId: string, data: CreateCronJobData) =>
			post<CronJob>(`/v1/projects/${projectId}/cron-jobs`, data),
		update: (id: string, data: UpdateCronJobData) =>
			patch<CronJob>(`/v1/cron-jobs/${id}`, data),
		delete: (id: string) => del(`/v1/cron-jobs/${id}`),
		pause: (id: string) => post<CronJob>(`/v1/cron-jobs/${id}/pause`, {}),
		resume: (id: string) => post<CronJob>(`/v1/cron-jobs/${id}/resume`, {}),
		durationStats: (id: string) =>
			get<DurationStats>(`/v1/cron-jobs/${id}/duration-stats`),
	},
	httpMonitors: {
		list: (projectId: string, params?: HttpMonitorListParams) => {
			const searchParams = new URLSearchParams()
			if (params?.page) searchParams.set("page", String(params.page))
			if (params?.limit) searchParams.set("limit", String(params.limit))
			if (params?.search) searchParams.set("search", params.search)
			if (params?.status) searchParams.set("status", params.status)
			const query = searchParams.toString()
			return get<HttpMonitorListResponse>(
				`/v1/projects/${projectId}/http-monitors${query ? `?${query}` : ""}`,
			)
		},
		get: (id: string) => get<HttpMonitor>(`/v1/http-monitors/${id}`),
		create: (projectId: string, data: CreateHttpMonitorData) =>
			post<HttpMonitor>(`/v1/projects/${projectId}/http-monitors`, data),
		update: (id: string, data: UpdateHttpMonitorData) =>
			patch<HttpMonitor>(`/v1/http-monitors/${id}`, data),
		delete: (id: string) => del(`/v1/http-monitors/${id}`),
		pause: (id: string) =>
			post<HttpMonitor>(`/v1/http-monitors/${id}/pause`, {}),
		resume: (id: string) =>
			post<HttpMonitor>(`/v1/http-monitors/${id}/resume`, {}),
	},
	channels: {
		list: (projectId: string) =>
			get<{ channels: Channel[] }>(`/v1/projects/${projectId}/channels`),
		get: (projectId: string, channelId: string) =>
			get<Channel>(`/v1/projects/${projectId}/channels/${channelId}`),
		create: (projectId: string, data: CreateChannelData) =>
			post<Channel>(`/v1/projects/${projectId}/channels`, data),
		update: (projectId: string, channelId: string, data: UpdateChannelData) =>
			patch<Channel>(`/v1/projects/${projectId}/channels/${channelId}`, data),
		delete: (projectId: string, channelId: string) =>
			del(`/v1/projects/${projectId}/channels/${channelId}`),
		test: (projectId: string, channelId: string) =>
			post<{ success: boolean; error?: string }>(
				`/v1/projects/${projectId}/channels/${channelId}/test`,
				{},
			),
	},
	apiKeys: {
		list: (projectId: string) =>
			get<{ apiKeys: ApiKey[] }>(`/v1/projects/${projectId}/api-keys`),
		create: (projectId: string, data: CreateApiKeyData) =>
			post<ApiKeyCreated>(`/v1/projects/${projectId}/api-keys`, data),
		delete: (projectId: string, apiKeyId: string) =>
			del(`/v1/projects/${projectId}/api-keys/${apiKeyId}`),
	},
	pings: {
		list: (cronJobId: string, params?: PingListParams) => {
			const searchParams = new URLSearchParams()
			if (params?.page) searchParams.set("page", String(params.page))
			if (params?.limit) searchParams.set("limit", String(params.limit))
			const query = searchParams.toString()
			return get<PingsListResponse>(
				`/v1/cron-jobs/${cronJobId}/pings${query ? `?${query}` : ""}`,
			)
		},
	},
	alerts: {
		listByCronJob: (cronJobId: string, params?: AlertFiltersParams) => {
			const searchParams = new URLSearchParams()
			if (params?.page) searchParams.set("page", String(params.page))
			if (params?.limit) searchParams.set("limit", String(params.limit))
			if (params?.event) searchParams.set("event", params.event)
			if (params?.fromDate) searchParams.set("fromDate", params.fromDate)
			if (params?.toDate) searchParams.set("toDate", params.toDate)
			const query = searchParams.toString()
			return get<CronJobAlertsListResponse>(
				`/v1/cron-jobs/${cronJobId}/alerts${query ? `?${query}` : ""}`,
			)
		},
		list: (params?: AlertOrgFiltersParams) => {
			const searchParams = new URLSearchParams()
			if (params?.page) searchParams.set("page", String(params.page))
			if (params?.limit) searchParams.set("limit", String(params.limit))
			if (params?.event) searchParams.set("event", params.event)
			if (params?.fromDate) searchParams.set("fromDate", params.fromDate)
			if (params?.toDate) searchParams.set("toDate", params.toDate)
			if (params?.projectId) searchParams.set("projectId", params.projectId)
			if (params?.cronJobId) searchParams.set("cronJobId", params.cronJobId)
			const query = searchParams.toString()
			return get<AlertsListResponse>(`/v1/alerts${query ? `?${query}` : ""}`)
		},
	},
	invitations: {
		list: (orgId: string) =>
			get<{ invitations: Invitation[] }>(
				`/v1/organizations/${orgId}/invites`,
				false,
			),
		create: (orgId: string, data: CreateInvitationData) =>
			post<Invitation>(`/v1/organizations/${orgId}/invites`, data, false),
		cancel: (orgId: string, inviteId: string) =>
			del(`/v1/organizations/${orgId}/invites/${inviteId}`, false),
		resend: (orgId: string, inviteId: string) =>
			post<Invitation>(
				`/v1/organizations/${orgId}/invites/${inviteId}/resend`,
				{},
				false,
			),
		accept: (token: string) =>
			post<AcceptInvitationResult>("/v1/invites/accept", { token }, false),
	},
	members: {
		list: (orgId: string) =>
			get<{ members: OrgMember[] }>(
				`/v1/organizations/${orgId}/members`,
				false,
			),
	},
	statusPages: {
		get: (projectId: string) =>
			get<StatusPage>(`/v1/projects/${projectId}/status-page`),
		create: (projectId: string, data: CreateStatusPageData) =>
			post<StatusPage>(`/v1/projects/${projectId}/status-page`, data),
		update: (projectId: string, data: UpdateStatusPageData) =>
			patch<StatusPage>(`/v1/projects/${projectId}/status-page`, data),
		delete: (projectId: string) => del(`/v1/projects/${projectId}/status-page`),
		listComponents: (projectId: string) =>
			get<{ components: StatusPageComponent[] }>(
				`/v1/projects/${projectId}/status-page/components`,
			),
		addComponent: (projectId: string, data: CreateComponentData) =>
			post<StatusPageComponent>(
				`/v1/projects/${projectId}/status-page/components`,
				data,
			),
		updateComponent: (
			projectId: string,
			componentId: string,
			data: UpdateComponentData,
		) =>
			patch<StatusPageComponent>(
				`/v1/projects/${projectId}/status-page/components/${componentId}`,
				data,
			),
		removeComponent: (projectId: string, componentId: string) =>
			del(`/v1/projects/${projectId}/status-page/components/${componentId}`),
		reorderComponents: (projectId: string, componentIds: string[]) =>
			post<{ components: StatusPageComponent[] }>(
				`/v1/projects/${projectId}/status-page/components/reorder`,
				{ componentIds },
			),
		setDomain: (projectId: string, domain: string | null) =>
			post<{ verifyToken: string | null }>(
				`/v1/projects/${projectId}/status-page/domain`,
				{ domain },
			),
		verifyDomain: (projectId: string) =>
			post<{ verified: boolean; error?: string }>(
				`/v1/projects/${projectId}/status-page/domain/verify`,
				{},
			),
	},
	publicStatus: {
		getBySlug: (slug: string) =>
			get<PublicStatusPage>(`/status/${slug}`, false),
		getByDomain: (domain: string) =>
			get<PublicStatusPage>(`/status/domain/${domain}`, false),
	},
	incidents: {
		list: (projectId: string, params?: { status?: string; limit?: number }) => {
			const searchParams = new URLSearchParams()
			if (params?.status) searchParams.set("status", params.status)
			if (params?.limit) searchParams.set("limit", String(params.limit))
			const query = searchParams.toString()
			return get<{ incidents: Incident[]; total: number }>(
				`/v1/projects/${projectId}/status-page/incidents${query ? `?${query}` : ""}`,
			)
		},
		listActive: (projectId: string) =>
			get<{ incidents: IncidentWithUpdates[] }>(
				`/v1/projects/${projectId}/status-page/incidents/active`,
			),
		get: (projectId: string, incidentId: string) =>
			get<IncidentWithUpdates>(
				`/v1/projects/${projectId}/status-page/incidents/${incidentId}`,
			),
		create: (projectId: string, data: CreateIncidentData) =>
			post<IncidentWithUpdates>(
				`/v1/projects/${projectId}/status-page/incidents`,
				data,
			),
		update: (projectId: string, incidentId: string, data: UpdateIncidentData) =>
			patch<Incident>(
				`/v1/projects/${projectId}/status-page/incidents/${incidentId}`,
				data,
			),
		delete: (projectId: string, incidentId: string) =>
			del(`/v1/projects/${projectId}/status-page/incidents/${incidentId}`),
		addUpdate: (
			projectId: string,
			incidentId: string,
			data: CreateIncidentUpdateData,
		) =>
			post<IncidentUpdate>(
				`/v1/projects/${projectId}/status-page/incidents/${incidentId}/updates`,
				data,
			),
	},
	maintenances: {
		list: (projectId: string, params?: { status?: string; limit?: number }) => {
			const searchParams = new URLSearchParams()
			if (params?.status) searchParams.set("status", params.status)
			if (params?.limit) searchParams.set("limit", String(params.limit))
			const query = searchParams.toString()
			return get<{ maintenances: Maintenance[]; total: number }>(
				`/v1/projects/${projectId}/status-page/maintenances${query ? `?${query}` : ""}`,
			)
		},
		listUpcoming: (projectId: string) =>
			get<{ maintenances: Maintenance[] }>(
				`/v1/projects/${projectId}/status-page/maintenances/upcoming`,
			),
		get: (projectId: string, maintenanceId: string) =>
			get<Maintenance>(
				`/v1/projects/${projectId}/status-page/maintenances/${maintenanceId}`,
			),
		create: (projectId: string, data: CreateMaintenanceData) =>
			post<Maintenance>(
				`/v1/projects/${projectId}/status-page/maintenances`,
				data,
			),
		update: (
			projectId: string,
			maintenanceId: string,
			data: UpdateMaintenanceData,
		) =>
			patch<Maintenance>(
				`/v1/projects/${projectId}/status-page/maintenances/${maintenanceId}`,
				data,
			),
		delete: (projectId: string, maintenanceId: string) =>
			del(
				`/v1/projects/${projectId}/status-page/maintenances/${maintenanceId}`,
			),
	},
}

export { createFetchError, isFetchError }
