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
	type Check,
	type CheckListParams,
	type CreateApiKeyData,
	type CreateChannelData,
	type CreateCheckData,
	type CreateInvitationData,
	type CreateProjectData,
	type Invitation,
	type Organization,
	type PingListParams,
	type Project,
	type UpdateChannelData,
	type UpdateCheckData,
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
		durationStats: (id: string) => ["checks", "durationStats", id] as const,
	},
	channels: {
		list: (projectId: string) => ["channels", projectId] as const,
	},
	apiKeys: {
		list: (projectId: string) => ["apiKeys", projectId] as const,
	},
	pings: {
		list: (checkId: string, params?: PingListParams) =>
			["pings", checkId, params] as const,
	},
	alerts: {
		listByCheck: (checkId: string, params?: AlertFiltersParams) =>
			["alerts", "check", checkId, params] as const,
		list: (params?: AlertOrgFiltersParams) =>
			["alerts", "org", params] as const,
	},
	invitations: {
		list: (orgId: string) => ["invitations", orgId] as const,
	},
	members: {
		list: (orgId: string) => ["members", orgId] as const,
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

export function useDurationStats(checkId: string) {
	return useQuery({
		queryKey: queryKeys.checks.durationStats(checkId),
		queryFn: () => api.checks.durationStats(checkId),
		enabled: !!checkId,
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
export function usePings(checkId: string, params?: PingListParams) {
	return useQuery({
		queryKey: queryKeys.pings.list(checkId, params),
		queryFn: () => api.pings.list(checkId, params),
		enabled: !!checkId,
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
export function useCheckAlerts(checkId: string, params?: AlertFiltersParams) {
	return useQuery({
		queryKey: queryKeys.alerts.listByCheck(checkId, params),
		queryFn: () => api.alerts.listByCheck(checkId, params),
		enabled: !!checkId,
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
