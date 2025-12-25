"use client"

import { CheckForm } from "@/components/checks/check-form"
import { CheckTable } from "@/components/checks/check-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { isLimitExceeded } from "@/lib/api"
import type { Check, CreateCheckData } from "@/lib/api"
import {
	useBilling,
	useChannels,
	useChecks,
	useCreateCheck,
	useUpdateCheck,
} from "@/lib/query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type ChecksTabProps = {
	projectId: string
}

export function ChecksTab({ projectId }: ChecksTabProps) {
	const { data, isLoading } = useChecks(projectId)
	const { data: channelsData } = useChannels(projectId)
	const { data: billing } = useBilling()
	const createCheck = useCreateCheck()
	const updateCheck = useUpdateCheck()

	const [showForm, setShowForm] = useState(false)
	const [editingCheck, setEditingCheck] = useState<Check | undefined>()
	const [showUpgrade, setShowUpgrade] = useState(false)

	const checkLimit = billing?.usage.checks.limit ?? 10

	function handleCreate(data: CreateCheckData & { channelIds?: string[] }) {
		createCheck.mutate(
			{ projectId, data },
			{
				onSuccess: () => {
					setShowForm(false)
					toast.success("Check created")
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

	function handleUpdate(data: CreateCheckData & { channelIds?: string[] }) {
		if (!editingCheck) return
		updateCheck.mutate(
			{ id: editingCheck.id, data },
			{
				onSuccess: () => {
					setEditingCheck(undefined)
					toast.success("Check updated")
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	return (
		<>
			<div className="flex justify-end mb-4">
				<Button onClick={() => setShowForm(true)}>
					<Plus className="h-4 w-4 mr-2" />
					New check
				</Button>
			</div>
			{isLoading ? (
				<Skeleton className="h-48" />
			) : (
				<CheckTable
					checks={data?.checks ?? []}
					projectId={projectId}
					onEdit={setEditingCheck}
				/>
			)}

			<CheckForm
				open={showForm}
				onOpenChange={setShowForm}
				onSubmit={handleCreate}
				channels={channelsData?.channels}
				isLoading={createCheck.isPending}
			/>

			<CheckForm
				open={!!editingCheck}
				onOpenChange={(open) => !open && setEditingCheck(undefined)}
				onSubmit={handleUpdate}
				check={editingCheck}
				channels={channelsData?.channels}
				isLoading={updateCheck.isPending}
			/>

			<UpgradeDialog
				open={showUpgrade}
				onOpenChange={setShowUpgrade}
				resource="checks"
				limit={checkLimit}
			/>
		</>
	)
}
