import {
	type UseMutationOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import {
	type ApiKeyCreated,
	type BillingInfo,
	type Channel,
	type Check,
	type CreateApiKeyData,
	type CreateChannelData,
	type CreateCheckData,
	type CreateProjectData,
	type DashboardCheck,
	type DashboardStats,
	type Project,
	type UpdateChannelData,
	type UpdateCheckData,
	type UpdateProjectData,
	api,
} from "./api"

export const queryKeys = {
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
		list: (projectId: string) => ["checks", projectId] as const,
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
export function useChecks(projectId: string) {
	return useQuery({
		queryKey: queryKeys.checks.list(projectId),
		queryFn: () => api.checks.list(projectId),
		enabled: !!projectId,
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
				queryKey: queryKeys.checks.list(projectId),
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
				queryKey: queryKeys.checks.list(check.projectId),
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
				queryKey: queryKeys.checks.list(projectId),
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
				queryKey: queryKeys.checks.list(check.projectId),
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
				queryKey: queryKeys.checks.list(check.projectId),
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
