"use client"

import { ApiKeyTable } from "@/components/api-keys/api-key-table"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiKeys } from "@/lib/query"

type ApiKeysTabProps = {
	projectId: string
}

export function ApiKeysTab({ projectId }: ApiKeysTabProps) {
	const { data, isLoading } = useApiKeys(projectId)

	if (isLoading) {
		return <Skeleton className="h-48" />
	}

	return <ApiKeyTable apiKeys={data?.apiKeys ?? []} projectId={projectId} />
}
