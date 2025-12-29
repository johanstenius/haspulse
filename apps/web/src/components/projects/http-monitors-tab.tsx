"use client"

import { HttpMonitorFilters } from "@/components/http-monitors/http-monitor-filters"
import { HttpMonitorForm } from "@/components/http-monitors/http-monitor-form"
import { HttpMonitorTable } from "@/components/http-monitors/http-monitor-table"
import { PaginationControls } from "@/components/pagination-controls"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { isLimitExceeded } from "@/lib/api"
import type { CreateHttpMonitorData, MonitorStatus } from "@/lib/api"
import {
	useBilling,
	useChannels,
	useCreateHttpMonitor,
	useHttpMonitors,
} from "@/lib/query"
import { Plus } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

const DEFAULT_LIMIT = 20

type HttpMonitorsTabProps = {
	projectId: string
}

function HttpMonitorsTabContent({ projectId }: HttpMonitorsTabProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const page = Number(searchParams.get("hpage")) || 1
	const search = searchParams.get("hsearch") ?? ""
	const status = (searchParams.get("hstatus") as MonitorStatus) || undefined

	function updateParams(updates: {
		page?: number
		search?: string
		status?: MonitorStatus | undefined
	}) {
		const params = new URLSearchParams(searchParams.toString())

		if (updates.search !== undefined || updates.status !== undefined) {
			params.delete("hpage")
		} else if (updates.page && updates.page !== 1) {
			params.set("hpage", String(updates.page))
		} else {
			params.delete("hpage")
		}

		if (updates.search !== undefined) {
			if (updates.search) {
				params.set("hsearch", updates.search)
			} else {
				params.delete("hsearch")
			}
		}

		if (updates.status !== undefined) {
			if (updates.status) {
				params.set("hstatus", updates.status)
			} else {
				params.delete("hstatus")
			}
		}

		const query = params.toString()
		router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
	}

	const { data, isLoading } = useHttpMonitors(projectId, {
		page,
		limit: DEFAULT_LIMIT,
		search: search || undefined,
		status,
	})
	const { data: channelsData } = useChannels(projectId)
	const { data: billing } = useBilling()
	const createHttpMonitor = useCreateHttpMonitor()

	const [showForm, setShowForm] = useState(false)
	const [showUpgrade, setShowUpgrade] = useState(false)

	const httpMonitorLimit = billing?.usage.httpMonitors.limit ?? 5

	function handleCreate(
		formData: CreateHttpMonitorData & { channelIds?: string[] },
	) {
		createHttpMonitor.mutate(
			{ projectId, data: formData },
			{
				onSuccess: () => {
					setShowForm(false)
					toast.success("HTTP monitor created")
				},
				onError: (error) => {
					if (isLimitExceeded(error)) {
						setShowForm(false)
						setShowUpgrade(true)
					} else {
						toast.error(error.message)
					}
				},
			},
		)
	}

	const hasFilters = search || status
	const hasNoResults =
		!isLoading && data?.httpMonitors.length === 0 && hasFilters

	return (
		<>
			<div className="flex justify-between items-start gap-4 mb-4">
				<HttpMonitorFilters
					search={search}
					status={status}
					onSearchChange={(s) => updateParams({ search: s })}
					onStatusChange={(s) => updateParams({ status: s })}
				/>
				<Button onClick={() => setShowForm(true)}>
					<Plus className="h-4 w-4 mr-2" />
					New HTTP monitor
				</Button>
			</div>

			{isLoading ? (
				<Skeleton className="h-48" />
			) : hasNoResults ? (
				<div className="text-center py-12 text-muted-foreground">
					<p>No HTTP monitors match your filters.</p>
					<Button
						variant="link"
						onClick={() => {
							updateParams({ search: "", status: undefined })
						}}
					>
						Clear filters
					</Button>
				</div>
			) : (
				<>
					<HttpMonitorTable
						httpMonitors={data?.httpMonitors ?? []}
						onAdd={() => setShowForm(true)}
					/>
					{data && data.totalPages > 1 && (
						<PaginationControls
							page={page}
							totalPages={data.totalPages}
							onPageChange={(p) => updateParams({ page: p })}
						/>
					)}
				</>
			)}

			<HttpMonitorForm
				open={showForm}
				onOpenChange={setShowForm}
				onSubmit={handleCreate}
				channels={channelsData?.channels}
				isLoading={createHttpMonitor.isPending}
			/>

			<UpgradeDialog
				open={showUpgrade}
				onOpenChange={setShowUpgrade}
				resource="HTTP monitors"
				limit={httpMonitorLimit}
			/>
		</>
	)
}

export function HttpMonitorsTab({ projectId }: HttpMonitorsTabProps) {
	return (
		<Suspense fallback={<Skeleton className="h-48" />}>
			<HttpMonitorsTabContent projectId={projectId} />
		</Suspense>
	)
}
