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
		checks: { current: number; limit: number | null }
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

export type CheckStatus = "NEW" | "UP" | "LATE" | "DOWN" | "PAUSED"
export type ScheduleType = "PERIOD" | "CRON"
export type AnomalySensitivity = "LOW" | "NORMAL" | "HIGH"

export type CheckListParams = {
	page?: number
	limit?: number
	search?: string
	status?: CheckStatus
}

export type CheckListResponse = {
	checks: Check[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export type PingType = "SUCCESS" | "START" | "FAIL"

export type SparklineSlot = "success" | "fail" | "missed" | "empty"

export type Check = {
	id: string
	projectId: string
	name: string
	slug: string | null
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds: number
	status: CheckStatus
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
	checkId: string
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

export type CreateCheckData = {
	name: string
	slug?: string
	scheduleType: ScheduleType
	scheduleValue: string
	graceSeconds?: number
	alertOnRecovery?: boolean
	reminderIntervalHours?: number
	anomalySensitivity?: AnomalySensitivity
}

export type UpdateCheckData = {
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
	totalChecks: number
	uptimePercent: number
	checksByStatus: {
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

export type DashboardCheck = {
	id: string
	name: string
	status: CheckStatus
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
export type AlertEvent = "check.down" | "check.up" | "check.still_down"

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
		checkId: string
		checkName: string
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
	checkId: string
	event: AlertEvent
	channels: AlertChannel[]
	context: AlertContext | null
	success: boolean
	error: string | null
	createdAt: string
}

export type AlertWithCheck = Alert & {
	checkName: string
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
	checkId?: string
}

export type CheckAlertsListResponse = {
	alerts: Alert[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export type AlertsListResponse = {
	alerts: AlertWithCheck[]
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
		checks: () => get<{ checks: DashboardCheck[] }>("/v1/dashboard/checks"),
	},
	projects: {
		list: () => get<{ projects: Project[] }>("/v1/projects"),
		get: (id: string) => get<Project>(`/v1/projects/${id}`),
		create: (data: CreateProjectData) => post<Project>("/v1/projects", data),
		update: (id: string, data: UpdateProjectData) =>
			patch<Project>(`/v1/projects/${id}`, data),
		delete: (id: string) => del(`/v1/projects/${id}`),
	},
	checks: {
		list: (projectId: string, params?: CheckListParams) => {
			const searchParams = new URLSearchParams()
			if (params?.page) searchParams.set("page", String(params.page))
			if (params?.limit) searchParams.set("limit", String(params.limit))
			if (params?.search) searchParams.set("search", params.search)
			if (params?.status) searchParams.set("status", params.status)
			const query = searchParams.toString()
			return get<CheckListResponse>(
				`/v1/projects/${projectId}/checks${query ? `?${query}` : ""}`,
			)
		},
		get: (id: string) => get<Check>(`/v1/checks/${id}`),
		create: (projectId: string, data: CreateCheckData) =>
			post<Check>(`/v1/projects/${projectId}/checks`, data),
		update: (id: string, data: UpdateCheckData) =>
			patch<Check>(`/v1/checks/${id}`, data),
		delete: (id: string) => del(`/v1/checks/${id}`),
		pause: (id: string) => post<Check>(`/v1/checks/${id}/pause`, {}),
		resume: (id: string) => post<Check>(`/v1/checks/${id}/resume`, {}),
		durationStats: (id: string) =>
			get<DurationStats>(`/v1/checks/${id}/duration-stats`),
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
		list: (checkId: string, params?: PingListParams) => {
			const searchParams = new URLSearchParams()
			if (params?.page) searchParams.set("page", String(params.page))
			if (params?.limit) searchParams.set("limit", String(params.limit))
			const query = searchParams.toString()
			return get<PingsListResponse>(
				`/v1/checks/${checkId}/pings${query ? `?${query}` : ""}`,
			)
		},
	},
	alerts: {
		listByCheck: (checkId: string, params?: AlertFiltersParams) => {
			const searchParams = new URLSearchParams()
			if (params?.page) searchParams.set("page", String(params.page))
			if (params?.limit) searchParams.set("limit", String(params.limit))
			if (params?.event) searchParams.set("event", params.event)
			if (params?.fromDate) searchParams.set("fromDate", params.fromDate)
			if (params?.toDate) searchParams.set("toDate", params.toDate)
			const query = searchParams.toString()
			return get<CheckAlertsListResponse>(
				`/v1/checks/${checkId}/alerts${query ? `?${query}` : ""}`,
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
			if (params?.checkId) searchParams.set("checkId", params.checkId)
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
}

export { createFetchError, isFetchError }
