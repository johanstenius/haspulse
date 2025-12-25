"use client"

import { ChannelCard } from "@/components/channels/channel-card"
import { ChannelForm } from "@/components/channels/channel-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { isLimitExceeded } from "@/lib/api"
import type { Channel, CreateChannelData } from "@/lib/api"
import { useChannels, useCreateChannel, useUpdateChannel } from "@/lib/query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type ChannelsTabProps = {
	projectId: string
}

export function ChannelsTab({ projectId }: ChannelsTabProps) {
	const { data, isLoading } = useChannels(projectId)
	const createChannel = useCreateChannel()
	const updateChannel = useUpdateChannel()

	const [showForm, setShowForm] = useState(false)
	const [editingChannel, setEditingChannel] = useState<Channel | undefined>()
	const [showUpgrade, setShowUpgrade] = useState(false)

	function handleCreate(data: CreateChannelData) {
		createChannel.mutate(
			{ projectId, data },
			{
				onSuccess: () => {
					setShowForm(false)
					toast.success("Channel created")
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

	function handleUpdate(data: CreateChannelData) {
		if (!editingChannel) return
		updateChannel.mutate(
			{
				projectId,
				channelId: editingChannel.id,
				data: { name: data.name, config: data.config },
			},
			{
				onSuccess: () => {
					setEditingChannel(undefined)
					toast.success("Channel updated")
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
					New channel
				</Button>
			</div>
			{isLoading ? (
				<Skeleton className="h-48" />
			) : data?.channels.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					No channels yet. Create one to receive alerts.
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{data?.channels.map((channel) => (
						<ChannelCard
							key={channel.id}
							channel={channel}
							onEdit={setEditingChannel}
						/>
					))}
				</div>
			)}

			<ChannelForm
				open={showForm}
				onOpenChange={setShowForm}
				onSubmit={handleCreate}
				isLoading={createChannel.isPending}
			/>

			<ChannelForm
				open={!!editingChannel}
				onOpenChange={(open) => !open && setEditingChannel(undefined)}
				onSubmit={handleUpdate}
				channel={editingChannel}
				isLoading={updateChannel.isPending}
			/>

			<UpgradeDialog
				open={showUpgrade}
				onOpenChange={setShowUpgrade}
				resource="channels"
				limit={3}
			/>
		</>
	)
}
