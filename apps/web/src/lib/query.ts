import {
	type UseMutationOptions,
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import {
	type AcceptInvitationResult,
	type ApiKeyCreated,
	type BillingInfo,
	type Channel,
	type Check,
	type CheckListParams,
	type CreateApiKeyData,
	type CreateChannelData,
	type CreateCheckData,
	type CreateIncidentData,
	type CreateIncidentUpdateData,
	type CreateInvitationData,
	type CreateMaintenanceData,
	type CreateProjectData,
	type DashboardCheck,
	type DashboardStats,
	type Incident,
	type IncidentListParams,
	type IncidentUpdate,
	type IncidentWithUpdates,
	type Invitation,
	type Maintenance,
	type MaintenanceListParams,
	type MaintenanceWithChecks,
	type OrgMember,
	type Organization,
	type Project,
	type UpdateChannelData,
	type UpdateCheckData,
	type UpdateIncidentData,
	type UpdateMaintenanceData,
	type UpdateOrgData,
	type UpdateProjectData,
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
		checks: ["dashboard", "checks"] as const,
	},
	projects: {
		all: ["projects"] as const,
		detail: (id: string) => ["projects", id] as const,
	},
	checks: {
		list: (projectId: string, params?: CheckListParams) =>
			["checks", projectId, params] as const,
		detail: (id: string) => ["checks", "detail", id] as const,
	},
	channels: {
		list: (projectId: string) => ["channels", projectId] as const,
	},
	apiKeys: {
		list: (projectId: string) => ["apiKeys", projectId] as const,
	},
	pings: {
		list: (checkId: string) => ["pings", checkId] as const,
	},
	invitations: {
		list: (orgId: string) => ["invitations", orgId] as const,
	},
	members: {
		list: (orgId: string) => ["members", orgId] as const,
	},
	incidents: {
		list: (projectId: string, params?: IncidentListParams) =>
			["incidents", projectId, params] as const,
		detail: (projectId: string, incidentId: string) =>
			["incidents", projectId, incidentId] as const,
	},
	maintenance: {
		list: (projectId: string, params?: MaintenanceListParams) =>
			["maintenance", projectId, params] as const,
		detail: (projectId: string, maintenanceId: string) =>
			["maintenance", projectId, maintenanceId] as const,
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

export function useDashboardChecks() {
	return useQuery({
		queryKey: queryKeys.dashboard.checks,
		queryFn: () => api.dashboard.checks(),
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

// Checks
export function useChecks(projectId: string, params?: CheckListParams) {
	return useQuery({
		queryKey: queryKeys.checks.list(projectId, params),
		queryFn: () => api.checks.list(projectId, params),
		enabled: !!projectId,
		placeholderData: keepPreviousData,
	})
}

export function useCheck(id: string) {
	return useQuery({
		queryKey: queryKeys.checks.detail(id),
		queryFn: () => api.checks.get(id),
		enabled: !!id,
	})
}

export function useCreateCheck(
	options?: UseMutationOptions<
		Check,
		Error,
		{ projectId: string; data: CreateCheckData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: { projectId: string; data: CreateCheckData }) =>
			api.checks.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: ["checks", projectId],
			})
		},
		...options,
	})
}

export function useUpdateCheck(
	options?: UseMutationOptions<
		Check,
		Error,
		{ id: string; data: UpdateCheckData }
	>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateCheckData }) =>
			api.checks.update(id, data),
		onSuccess: (check) => {
			queryClient.invalidateQueries({
				queryKey: ["checks", check.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.checks.detail(check.id),
			})
		},
		...options,
	})
}

export function useDeleteCheck(
	options?: UseMutationOptions<void, Error, { id: string; projectId: string }>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id }: { id: string; projectId: string }) =>
			api.checks.delete(id),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: ["checks", projectId],
			})
		},
		...options,
	})
}

export function usePauseCheck(
	options?: UseMutationOptions<Check, Error, string>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.checks.pause(id),
		onSuccess: (check) => {
			queryClient.invalidateQueries({
				queryKey: ["checks", check.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.checks.detail(check.id),
			})
		},
		...options,
	})
}

export function useResumeCheck(
	options?: UseMutationOptions<Check, Error, string>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.checks.resume(id),
		onSuccess: (check) => {
			queryClient.invalidateQueries({
				queryKey: ["checks", check.projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.checks.detail(check.id),
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
export function usePings(checkId: string, limit?: number) {
	return useQuery({
		queryKey: queryKeys.pings.list(checkId),
		queryFn: () => api.pings.list(checkId, limit),
		enabled: !!checkId,
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

// Incidents
export function useIncidents(projectId: string, params?: IncidentListParams) {
	return useQuery({
		queryKey: queryKeys.incidents.list(projectId, params),
		queryFn: () => api.incidents.list(projectId, params),
		enabled: !!projectId,
		placeholderData: keepPreviousData,
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
		Incident,
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
				queryKey: ["incidents", projectId],
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
				queryKey: ["incidents", projectId],
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
				queryKey: ["incidents", projectId],
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
				queryKey: ["incidents", projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.incidents.detail(projectId, incidentId),
			})
		},
		...options,
	})
}

// Maintenance
export function useMaintenance(
	projectId: string,
	params?: MaintenanceListParams,
) {
	return useQuery({
		queryKey: queryKeys.maintenance.list(projectId, params),
		queryFn: () => api.maintenance.list(projectId, params),
		enabled: !!projectId,
		placeholderData: keepPreviousData,
	})
}

export function useMaintenanceDetail(projectId: string, maintenanceId: string) {
	return useQuery({
		queryKey: queryKeys.maintenance.detail(projectId, maintenanceId),
		queryFn: () => api.maintenance.get(projectId, maintenanceId),
		enabled: !!projectId && !!maintenanceId,
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
			api.maintenance.create(projectId, data),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: ["maintenance", projectId],
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
		}) => api.maintenance.update(projectId, maintenanceId, data),
		onSuccess: (_, { projectId, maintenanceId }) => {
			queryClient.invalidateQueries({
				queryKey: ["maintenance", projectId],
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.maintenance.detail(projectId, maintenanceId),
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
			api.maintenance.delete(projectId, maintenanceId),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: ["maintenance", projectId],
			})
		},
		...options,
	})
}
