"use client"

import { AlertFilters } from "@/components/alerts/alert-filters"
import { AlertTable } from "@/components/alerts/alert-table"
import { PageHeader } from "@/components/page-header"
import { PaginationControls } from "@/components/pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"
import type { AlertEvent } from "@/lib/api"
import { useAlerts } from "@/lib/query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

const DEFAULT_LIMIT = 20

function AlertsPageContent() {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const page = Number(searchParams.get("page")) || 1
	const projectId = searchParams.get("projectId") ?? undefined
	const cronJobId = searchParams.get("cronJobId") ?? undefined
	const event = (searchParams.get("event") as AlertEvent) ?? undefined

	function updateParams(updates: {
		page?: number
		projectId?: string
		cronJobId?: string
		event?: AlertEvent
	}) {
		const params = new URLSearchParams(searchParams.toString())

		if (
			updates.projectId !== undefined ||
			updates.cronJobId !== undefined ||
			updates.event !== undefined
		) {
			params.delete("page")
		} else if (updates.page && updates.page !== 1) {
			params.set("page", String(updates.page))
		} else {
			params.delete("page")
		}

		if (updates.projectId !== undefined) {
			if (updates.projectId) {
				params.set("projectId", updates.projectId)
			} else {
				params.delete("projectId")
				params.delete("cronJobId")
			}
		}

		if (updates.cronJobId !== undefined) {
			if (updates.cronJobId) {
				params.set("cronJobId", updates.cronJobId)
			} else {
				params.delete("cronJobId")
			}
		}

		if (updates.event !== undefined) {
			if (updates.event) {
				params.set("event", updates.event)
			} else {
				params.delete("event")
			}
		}

		const query = params.toString()
		router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
	}

	const { data, isLoading } = useAlerts({
		page,
		limit: DEFAULT_LIMIT,
		projectId,
		cronJobId,
		event,
	})

	return (
		<div className="p-6">
			<PageHeader title="Alerts" />

			<div className="mb-4">
				<AlertFilters
					projectId={projectId}
					cronJobId={cronJobId}
					event={event}
					onProjectChange={(v) => updateParams({ projectId: v })}
					onCronJobChange={(v) => updateParams({ cronJobId: v })}
					onEventChange={(v) => updateParams({ event: v })}
				/>
			</div>

			{isLoading ? (
				<Skeleton className="h-48" />
			) : (
				<>
					<AlertTable alerts={data?.alerts ?? []} showCronJobColumn />
					{data && data.totalPages > 1 && (
						<PaginationControls
							page={page}
							totalPages={data.totalPages}
							onPageChange={(p) => updateParams({ page: p })}
						/>
					)}
				</>
			)}
		</div>
	)
}

export default function AlertsPage() {
	return (
		<Suspense fallback={<Skeleton className="h-48 m-6" />}>
			<AlertsPageContent />
		</Suspense>
	)
}
