"use client"

import { CronJobFilters } from "@/components/cron-jobs/cron-job-filters"
import { CronJobForm } from "@/components/cron-jobs/cron-job-form"
import { CronJobTable } from "@/components/cron-jobs/cron-job-table"
import { PaginationControls } from "@/components/pagination-controls"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { isLimitExceeded } from "@/lib/api"
import type { CreateCronJobData, MonitorStatus } from "@/lib/api"
import {
	useBilling,
	useChannels,
	useCreateCronJob,
	useCronJobs,
} from "@/lib/query"
import { Plus } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

const DEFAULT_LIMIT = 20

type CronJobsTabProps = {
	projectId: string
}

function CronJobsTabContent({ projectId }: CronJobsTabProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const page = Number(searchParams.get("page")) || 1
	const search = searchParams.get("search") ?? ""
	const status = (searchParams.get("status") as MonitorStatus) || undefined

	function updateParams(updates: {
		page?: number
		search?: string
		status?: MonitorStatus | undefined
	}) {
		const params = new URLSearchParams(searchParams.toString())

		if (updates.search !== undefined || updates.status !== undefined) {
			params.delete("page")
		} else if (updates.page && updates.page !== 1) {
			params.set("page", String(updates.page))
		} else {
			params.delete("page")
		}

		if (updates.search !== undefined) {
			if (updates.search) {
				params.set("search", updates.search)
			} else {
				params.delete("search")
			}
		}

		if (updates.status !== undefined) {
			if (updates.status) {
				params.set("status", updates.status)
			} else {
				params.delete("status")
			}
		}

		const query = params.toString()
		router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
	}

	const { data, isLoading } = useCronJobs(projectId, {
		page,
		limit: DEFAULT_LIMIT,
		search: search || undefined,
		status,
	})
	const { data: channelsData } = useChannels(projectId)
	const { data: billing } = useBilling()
	const createCronJob = useCreateCronJob()

	const [showForm, setShowForm] = useState(false)
	const [showUpgrade, setShowUpgrade] = useState(false)

	const cronJobLimit = billing?.usage.cronJobs.limit ?? 20

	function handleCreate(
		formData: CreateCronJobData & { channelIds?: string[] },
	) {
		createCronJob.mutate(
			{ projectId, data: formData },
			{
				onSuccess: () => {
					setShowForm(false)
					toast.success("Cron job created")
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
	const hasNoResults = !isLoading && data?.cronJobs.length === 0 && hasFilters

	return (
		<>
			<div className="flex justify-between items-start gap-4 mb-4">
				<CronJobFilters
					search={search}
					status={status}
					onSearchChange={(s) => updateParams({ search: s })}
					onStatusChange={(s) => updateParams({ status: s })}
				/>
				<Button onClick={() => setShowForm(true)}>
					<Plus className="h-4 w-4 mr-2" />
					New cron job
				</Button>
			</div>

			{isLoading ? (
				<Skeleton className="h-48" />
			) : hasNoResults ? (
				<div className="text-center py-12 text-muted-foreground">
					<p>No cron jobs match your filters.</p>
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
					<CronJobTable
						cronJobs={data?.cronJobs ?? []}
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

			<CronJobForm
				open={showForm}
				onOpenChange={setShowForm}
				onSubmit={handleCreate}
				channels={channelsData?.channels}
				isLoading={createCronJob.isPending}
			/>

			<UpgradeDialog
				open={showUpgrade}
				onOpenChange={setShowUpgrade}
				resource="cron jobs"
				limit={cronJobLimit}
			/>
		</>
	)
}

export function CronJobsTab({ projectId }: CronJobsTabProps) {
	return (
		<Suspense fallback={<Skeleton className="h-48" />}>
			<CronJobsTabContent projectId={projectId} />
		</Suspense>
	)
}
