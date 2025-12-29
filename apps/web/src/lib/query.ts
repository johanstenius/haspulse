import {
	type UseMutationOptions,
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import {
	type AcceptInvitationResult,
	type AlertFiltersParams,
	type AlertOrgFiltersParams,
	type ApiKeyCreated,
	type Channel,
	type CreateApiKeyData,
	type CreateChannelData,
	type CreateComponentData,
	type CreateCronJobData,
	type CreateHttpMonitorData,
	type CreateIncidentData,
	type CreateIncidentUpdateData,
	type CreateInvitationData,
	type CreateMaintenanceData,
	type CreateProjectData,
	type CreateStatusPageData,
	type CronJob,
	type CronJobListParams,
	type HttpMonitor,
	type HttpMonitorListParams,
	type Incident,
	type IncidentUpdate,
	type IncidentWithUpdates,
	type Invitation,
	type Maintenance,
	type Organization,
	type PingListParams,
	type Project,
	type StatusPage,
	type StatusPageComponent,
	type UpdateChannelData,
	type UpdateComponentData,
	type UpdateCronJobData,
	type UpdateHttpMonitorData,
	type UpdateIncidentData,
	type UpdateMaintenanceData,
	type UpdateOrgData,
	type UpdateProjectData,
	type UpdateStatusPageData,
	api,
} from "./api"

export const queryKeys = {
	organizations: {
		detail: (id: string) => ["organizations", id] as const,
	},
	billing: {
		info: ["billing"] as const,
	},
	dashboard: {
		stats: ["dashboard", "stats"] as const,
		cronJobs: ["dashboard", "cronJobs"] as const,
	},
	projects: {
		all: ["projects"] as const,
		detail: (id: string) => ["projects", id] as const,
	},
	cronJobs: {
		list: (projectId: string, params?: CronJobListParams) =>
			["cronJobs", projectId, params] as const,
		detail: (id: string) => ["cronJobs", "detail", id] as const,
		durationStats: (id: string) => ["cronJobs", "durationStats", id] as const,
	},
	httpMonitors: {
		list: (projectId: string, params?: HttpMonitorListParams) =>
			["httpMonitors", projectId, params] as const,
		detail: (id: string) => ["httpMonitors", "detail", id] as const,
	},
	channels: {
		list: (projectId: string) => ["channels", projectId] as const,
	},
	apiKeys: {
		list: (projectId: string) => ["apiKeys", projectId] as const,
	},
	pings: {
		list: (cronJobId: string, params?: PingListParams) =>
			["pings", cronJobId, params] as const,
	},
	alerts: {
		listByCronJob: (cronJobId: string, params?: AlertFiltersParams) =>
			["alerts", "cronJob", cronJobId, params] as const,
		list: (params?: AlertOrgFiltersParams) =>
			["alerts", "org", params] as const,
	},
	invitations: {
		list: (orgId: string) => ["invitations", orgId] as const,
	},
	members: {
		list: (orgId: string) => ["members", orgId] as const,
	},
	statusPages: {
		detail: (projectId: string) => ["statusPages", projectId] as const,
		components: (projectId: string) =>
			["statusPages", projectId, "components"] as const,
	},
	incidents: {
		list: (projectId: string) => ["incidents", projectId] as const,
		active: (projectId: string) => ["incidents", projectId, "active"] as const,
		detail: (projectId: string, incidentId: string) =>
			["incidents", projectId, incidentId] as const,
	},
	maintenances: {
		list: (projectId: string) => ["maintenances", projectId] as const,
		upcoming: (projectId: string) =>
			["maintenances", projectId, "upcoming"] as const,
		detail: (projectId: string, maintenanceId: string) =>
			["maintenances", projectId, maintenanceId] as const,
	},
	publicStatus: {
		bySlug: (slug: string) => ["publicStatus", "slug", slug] as const,
		byDomain: (domain: string) => ["publicStatus", "domain", domain] as const,
	},
}

// Organizations
export function useOrganization(id: string) {
	return useQuery({
		queryKey: queryKeys.organizations.detail(id),
		queryFn: () => api.organizations.get(id),
		enabled: !!id,
	})
}

export function useUpdateOrganization(
	options?: UseMutationOptions<
		Organization,
		Error,
		{ id: string; data: UpdateOrgData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateOrgData }) =>
			api.organizations.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.organizations.detail(id),
			})
		},
		...options,
	})
}

// Dashboard
export function useDashboardStats() {
	return useQuery({
		queryKey: queryKeys.dashboard.stats,
		queryFn: () => api.dashboard.stats(),
	})
}

export function useDashboardCronJobs() {
	return useQuery({
		queryKey: queryKeys.dashboard.cronJobs,
		queryFn: () => api.dashboard.cronJobs(),
	})
}

// Projects
export function useProjects() {
	return useQuery({
		queryKey: queryKeys.projects.all,
		queryFn: () => api.projects.list(),
	})
}

export function useProject(id: string) {
	return useQuery({
		queryKey: queryKeys.projects.detail(id),
		queryFn: () => api.projects.get(id),
		enabled: !!id,
	})
}

export function useCreateProject(
	options?: UseMutationOptions<Project, Error, CreateProjectData>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: CreateProjectData) => api.projects.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
		},
		...options,
	})
}

export function useUpdateProject(
	options?: UseMutationOptions<
		Project,
		Error,
		{ id: string; data: UpdateProjectData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
			api.projects.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
			queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) })
		},
		...options,
	})
}

export function useDeleteProject(
	options?: UseMutationOptions<void, Error, string>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.projects.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
		},
		...options,
	})
}

// Cron Jobs
export function useCronJobs(projectId: string, params?: CronJobListParams) {
	return useQuery({
		queryKey: queryKeys.cronJobs.list(projectId, params),
		queryFn: () => api.cronJobs.list(projectId, params),
		enabled: !!projectId,
		placeholderData: keepPreviousData,
	})
}

export function useCronJob(id: string) {
	return useQuery({
		queryKey: queryKeys.cronJobs.detail(id),
		queryFn: () => api.cronJobs.get(id),
		enabled: !!id,
	})
}

export function useCreateCronJob(
	options?: UseMutationOptions<
		CronJob,
		Error,
		{ projectId: string; data: CreateCronJobData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateCronJobData }) =>
			api.cronJobs.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: ["cronJobs", projectId],
			})
		},
		...options,
	})
}

export function useUpdateCronJob(
	options?: UseMutationOptions<
		CronJob,
		Error,
		{ id: string; data: UpdateCronJobData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateCronJobData }) =>
			api.cronJobs.update(id, data),
		onSuccess: (cronJob) => {
			queryClient.invalidateQueries({
				queryKey: ["cronJobs", cronJob.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.cronJobs.detail(cronJob.id),
			})
		},
		...options,
	})
}

export function useDeleteCronJob(
	options?: UseMutationOptions<void, Error, { id: string; projectId: string }>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id }: { id: string; projectId: string }) =>
			api.cronJobs.delete(id),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: ["cronJobs", projectId],
			})
		},
		...options,
	})
}

export function usePauseCronJob(
	options?: UseMutationOptions<CronJob, Error, string>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.cronJobs.pause(id),
		onSuccess: (cronJob) => {
			queryClient.invalidateQueries({
				queryKey: ["cronJobs", cronJob.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.cronJobs.detail(cronJob.id),
			})
		},
		...options,
	})
}

export function useResumeCronJob(
	options?: UseMutationOptions<CronJob, Error, string>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.cronJobs.resume(id),
		onSuccess: (cronJob) => {
			queryClient.invalidateQueries({
				queryKey: ["cronJobs", cronJob.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.cronJobs.detail(cronJob.id),
			})
		},
		...options,
	})
}

export function useDurationStats(cronJobId: string) {
	return useQuery({
		queryKey: queryKeys.cronJobs.durationStats(cronJobId),
		queryFn: () => api.cronJobs.durationStats(cronJobId),
		enabled: !!cronJobId,
	})
}

// HTTP Monitors
export function useHttpMonitors(
	projectId: string,
	params?: HttpMonitorListParams,
) {
	return useQuery({
		queryKey: queryKeys.httpMonitors.list(projectId, params),
		queryFn: () => api.httpMonitors.list(projectId, params),
		enabled: !!projectId,
		placeholderData: keepPreviousData,
	})
}

export function useHttpMonitor(id: string) {
	return useQuery({
		queryKey: queryKeys.httpMonitors.detail(id),
		queryFn: () => api.httpMonitors.get(id),
		enabled: !!id,
	})
}

export function useCreateHttpMonitor(
	options?: UseMutationOptions<
		HttpMonitor,
		Error,
		{ projectId: string; data: CreateHttpMonitorData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateHttpMonitorData }) =>
			api.httpMonitors.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: ["httpMonitors", projectId],
			})
		},
		...options,
	})
}

export function useUpdateHttpMonitor(
	options?: UseMutationOptions<
		HttpMonitor,
		Error,
		{ id: string; data: UpdateHttpMonitorData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateHttpMonitorData }) =>
			api.httpMonitors.update(id, data),
		onSuccess: (monitor) => {
			queryClient.invalidateQueries({
				queryKey: ["httpMonitors", monitor.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.httpMonitors.detail(monitor.id),
			})
		},
		...options,
	})
}

export function useDeleteHttpMonitor(
	options?: UseMutationOptions<void, Error, { id: string; projectId: string }>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id }: { id: string; projectId: string }) =>
			api.httpMonitors.delete(id),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: ["httpMonitors", projectId],
			})
		},
		...options,
	})
}

export function usePauseHttpMonitor(
	options?: UseMutationOptions<HttpMonitor, Error, string>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.httpMonitors.pause(id),
		onSuccess: (monitor) => {
			queryClient.invalidateQueries({
				queryKey: ["httpMonitors", monitor.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.httpMonitors.detail(monitor.id),
			})
		},
		...options,
	})
}

export function useResumeHttpMonitor(
	options?: UseMutationOptions<HttpMonitor, Error, string>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.httpMonitors.resume(id),
		onSuccess: (monitor) => {
			queryClient.invalidateQueries({
				queryKey: ["httpMonitors", monitor.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.httpMonitors.detail(monitor.id),
			})
		},
		...options,
	})
}

// Channels
export function useChannels(projectId: string) {
	return useQuery({
		queryKey: queryKeys.channels.list(projectId),
		queryFn: () => api.channels.list(projectId),
		enabled: !!projectId,
	})
}

export function useCreateChannel(
	options?: UseMutationOptions<
		Channel,
		Error,
		{ projectId: string; data: CreateChannelData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateChannelData }) =>
			api.channels.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.channels.list(projectId),
			})
		},
		...options,
	})
}

export function useUpdateChannel(
	options?: UseMutationOptions<
		Channel,
		Error,
		{ projectId: string; channelId: string; data: UpdateChannelData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			channelId,
			data,
		}: { projectId: string; channelId: string; data: UpdateChannelData }) =>
			api.channels.update(projectId, channelId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.channels.list(projectId),
			})
		},
		...options,
	})
}

export function useDeleteChannel(
	options?: UseMutationOptions<
		void,
		Error,
		{ projectId: string; channelId: string }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			channelId,
		}: { projectId: string; channelId: string }) =>
			api.channels.delete(projectId, channelId),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.channels.list(projectId),
			})
		},
		...options,
	})
}

export function useTestChannel(
	options?: UseMutationOptions<
		{ success: boolean; error?: string },
		Error,
		{ projectId: string; channelId: string }
	>,
) {
	return useMutation({
		mutationFn: ({
			projectId,
			channelId,
		}: { projectId: string; channelId: string }) =>
			api.channels.test(projectId, channelId),
		...options,
	})
}

// API Keys
export function useApiKeys(projectId: string) {
	return useQuery({
		queryKey: queryKeys.apiKeys.list(projectId),
		queryFn: () => api.apiKeys.list(projectId),
		enabled: !!projectId,
	})
}

export function useCreateApiKey(
	options?: UseMutationOptions<
		ApiKeyCreated,
		Error,
		{ projectId: string; data: CreateApiKeyData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateApiKeyData }) =>
			api.apiKeys.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.apiKeys.list(projectId),
			})
		},
		...options,
	})
}

export function useDeleteApiKey(
	options?: UseMutationOptions<
		void,
		Error,
		{ projectId: string; apiKeyId: string }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			apiKeyId,
		}: { projectId: string; apiKeyId: string }) =>
			api.apiKeys.delete(projectId, apiKeyId),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.apiKeys.list(projectId),
			})
		},
		...options,
	})
}

// Pings
export function usePings(cronJobId: string, params?: PingListParams) {
	return useQuery({
		queryKey: queryKeys.pings.list(cronJobId, params),
		queryFn: () => api.pings.list(cronJobId, params),
		enabled: !!cronJobId,
		placeholderData: keepPreviousData,
	})
}

// Billing
export function useBilling() {
	return useQuery({
		queryKey: queryKeys.billing.info,
		queryFn: () => api.billing.get(),
	})
}

// Members
export function useMembers(orgId: string) {
	return useQuery({
		queryKey: queryKeys.members.list(orgId),
		queryFn: () => api.members.list(orgId),
		enabled: !!orgId,
	})
}

// Invitations
export function useInvitations(orgId: string) {
	return useQuery({
		queryKey: queryKeys.invitations.list(orgId),
		queryFn: () => api.invitations.list(orgId),
		enabled: !!orgId,
	})
}

export function useCreateInvitation(
	options?: UseMutationOptions<
		Invitation,
		Error,
		{ orgId: string; data: CreateInvitationData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			orgId,
			data,
		}: { orgId: string; data: CreateInvitationData }) =>
			api.invitations.create(orgId, data),
		onSuccess: (_, { orgId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.invitations.list(orgId),
			})
		},
		...options,
	})
}

export function useCancelInvitation(
	options?: UseMutationOptions<
		void,
		Error,
		{ orgId: string; inviteId: string }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ orgId, inviteId }: { orgId: string; inviteId: string }) =>
			api.invitations.cancel(orgId, inviteId),
		onSuccess: (_, { orgId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.invitations.list(orgId),
			})
		},
		...options,
	})
}

export function useResendInvitation(
	options?: UseMutationOptions<
		Invitation,
		Error,
		{ orgId: string; inviteId: string }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ orgId, inviteId }: { orgId: string; inviteId: string }) =>
			api.invitations.resend(orgId, inviteId),
		onSuccess: (_, { orgId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.invitations.list(orgId),
			})
		},
		...options,
	})
}

export function useAcceptInvitation(
	options?: UseMutationOptions<AcceptInvitationResult, Error, string>,
) {
	return useMutation({
		mutationFn: (token: string) => api.invitations.accept(token),
		...options,
	})
}

// Alerts
export function useCronJobAlerts(
	cronJobId: string,
	params?: AlertFiltersParams,
) {
	return useQuery({
		queryKey: queryKeys.alerts.listByCronJob(cronJobId, params),
		queryFn: () => api.alerts.listByCronJob(cronJobId, params),
		enabled: !!cronJobId,
		placeholderData: keepPreviousData,
	})
}

export function useAlerts(params?: AlertOrgFiltersParams) {
	return useQuery({
		queryKey: queryKeys.alerts.list(params),
		queryFn: () => api.alerts.list(params),
		placeholderData: keepPreviousData,
	})
}

// Status Pages
export function useStatusPage(projectId: string) {
	return useQuery({
		queryKey: queryKeys.statusPages.detail(projectId),
		queryFn: () => api.statusPages.get(projectId),
		enabled: !!projectId,
		retry: false,
	})
}

export function useCreateStatusPage(
	options?: UseMutationOptions<
		StatusPage,
		Error,
		{ projectId: string; data: CreateStatusPageData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateStatusPageData }) =>
			api.statusPages.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.detail(projectId),
			})
		},
		...options,
	})
}

export function useUpdateStatusPage(
	options?: UseMutationOptions<
		StatusPage,
		Error,
		{ projectId: string; data: UpdateStatusPageData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: UpdateStatusPageData }) =>
			api.statusPages.update(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.detail(projectId),
			})
		},
		...options,
	})
}

export function useDeleteStatusPage(
	options?: UseMutationOptions<void, Error, string>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (projectId: string) => api.statusPages.delete(projectId),
		onSuccess: (_, projectId) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.detail(projectId),
			})
		},
		...options,
	})
}

export function useStatusPageComponents(projectId: string) {
	return useQuery({
		queryKey: queryKeys.statusPages.components(projectId),
		queryFn: () => api.statusPages.listComponents(projectId),
		enabled: !!projectId,
	})
}

export function useAddStatusPageComponent(
	options?: UseMutationOptions<
		StatusPageComponent,
		Error,
		{ projectId: string; data: CreateComponentData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateComponentData }) =>
			api.statusPages.addComponent(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.components(projectId),
			})
		},
		...options,
	})
}

export function useUpdateStatusPageComponent(
	options?: UseMutationOptions<
		StatusPageComponent,
		Error,
		{ projectId: string; componentId: string; data: UpdateComponentData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			componentId,
			data,
		}: {
			projectId: string
			componentId: string
			data: UpdateComponentData
		}) => api.statusPages.updateComponent(projectId, componentId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.components(projectId),
			})
		},
		...options,
	})
}

export function useRemoveStatusPageComponent(
	options?: UseMutationOptions<
		void,
		Error,
		{ projectId: string; componentId: string }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			componentId,
		}: { projectId: string; componentId: string }) =>
			api.statusPages.removeComponent(projectId, componentId),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.components(projectId),
			})
		},
		...options,
	})
}

export function useReorderStatusPageComponents(
	options?: UseMutationOptions<
		{ components: StatusPageComponent[] },
		Error,
		{ projectId: string; componentIds: string[] }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			componentIds,
		}: { projectId: string; componentIds: string[] }) =>
			api.statusPages.reorderComponents(projectId, componentIds),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.components(projectId),
			})
		},
		...options,
	})
}

export function useSetDomain(
	options?: UseMutationOptions<
		{ verifyToken: string | null },
		Error,
		{ projectId: string; domain: string | null }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			domain,
		}: { projectId: string; domain: string | null }) =>
			api.statusPages.setDomain(projectId, domain),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.detail(projectId),
			})
		},
		...options,
	})
}

export function useVerifyDomain(
	options?: UseMutationOptions<
		{ verified: boolean; error?: string },
		Error,
		{ projectId: string }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ projectId }: { projectId: string }) =>
			api.statusPages.verifyDomain(projectId),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.statusPages.detail(projectId),
			})
		},
		...options,
	})
}

// Incidents
export function useIncidents(projectId: string) {
	return useQuery({
		queryKey: queryKeys.incidents.list(projectId),
		queryFn: () => api.incidents.list(projectId, { limit: 50 }),
		enabled: !!projectId,
	})
}

export function useActiveIncidents(projectId: string) {
	return useQuery({
		queryKey: queryKeys.incidents.active(projectId),
		queryFn: () => api.incidents.listActive(projectId),
		enabled: !!projectId,
	})
}

export function useIncident(projectId: string, incidentId: string) {
	return useQuery({
		queryKey: queryKeys.incidents.detail(projectId, incidentId),
		queryFn: () => api.incidents.get(projectId, incidentId),
		enabled: !!projectId && !!incidentId,
	})
}

export function useCreateIncident(
	options?: UseMutationOptions<
		IncidentWithUpdates,
		Error,
		{ projectId: string; data: CreateIncidentData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateIncidentData }) =>
			api.incidents.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.list(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.active(projectId),
			})
		},
		...options,
	})
}

export function useUpdateIncident(
	options?: UseMutationOptions<
		Incident,
		Error,
		{ projectId: string; incidentId: string; data: UpdateIncidentData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			incidentId,
			data,
		}: { projectId: string; incidentId: string; data: UpdateIncidentData }) =>
			api.incidents.update(projectId, incidentId, data),
		onSuccess: (_, { projectId, incidentId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.list(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.active(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.detail(projectId, incidentId),
			})
		},
		...options,
	})
}

export function useAddIncidentUpdate(
	options?: UseMutationOptions<
		IncidentUpdate,
		Error,
		{ projectId: string; incidentId: string; data: CreateIncidentUpdateData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			incidentId,
			data,
		}: {
			projectId: string
			incidentId: string
			data: CreateIncidentUpdateData
		}) => api.incidents.addUpdate(projectId, incidentId, data),
		onSuccess: (_, { projectId, incidentId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.list(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.active(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.detail(projectId, incidentId),
			})
		},
		...options,
	})
}

export function useDeleteIncident(
	options?: UseMutationOptions<
		void,
		Error,
		{ projectId: string; incidentId: string }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			incidentId,
		}: { projectId: string; incidentId: string }) =>
			api.incidents.delete(projectId, incidentId),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.list(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.active(projectId),
			})
		},
		...options,
	})
}

// Maintenances
export function useMaintenances(projectId: string) {
	return useQuery({
		queryKey: queryKeys.maintenances.list(projectId),
		queryFn: () => api.maintenances.list(projectId, { limit: 50 }),
		enabled: !!projectId,
	})
}

export function useUpcomingMaintenances(projectId: string) {
	return useQuery({
		queryKey: queryKeys.maintenances.upcoming(projectId),
		queryFn: () => api.maintenances.listUpcoming(projectId),
		enabled: !!projectId,
	})
}

export function useCreateMaintenance(
	options?: UseMutationOptions<
		Maintenance,
		Error,
		{ projectId: string; data: CreateMaintenanceData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateMaintenanceData }) =>
			api.maintenances.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.maintenances.list(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.maintenances.upcoming(projectId),
			})
		},
		...options,
	})
}

export function useUpdateMaintenance(
	options?: UseMutationOptions<
		Maintenance,
		Error,
		{ projectId: string; maintenanceId: string; data: UpdateMaintenanceData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			maintenanceId,
			data,
		}: {
			projectId: string
			maintenanceId: string
			data: UpdateMaintenanceData
		}) => api.maintenances.update(projectId, maintenanceId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.maintenances.list(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.maintenances.upcoming(projectId),
			})
		},
		...options,
	})
}

export function useDeleteMaintenance(
	options?: UseMutationOptions<
		void,
		Error,
		{ projectId: string; maintenanceId: string }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			maintenanceId,
		}: { projectId: string; maintenanceId: string }) =>
			api.maintenances.delete(projectId, maintenanceId),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.maintenances.list(projectId),
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.maintenances.upcoming(projectId),
			})
		},
		...options,
	})
}
