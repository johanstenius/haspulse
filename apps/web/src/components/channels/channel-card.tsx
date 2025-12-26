"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Channel, ChannelType } from "@/lib/api"
import { useDeleteChannel, useTestChannel } from "@/lib/query"
import {
	Globe,
	Loader2,
	Mail,
	MessageSquare,
	Pencil,
	Play,
	Trash2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type ChannelCardProps = {
	channel: Channel
	onEdit: (channel: Channel) => void
}

const channelIcons: Record<ChannelType, typeof Mail> = {
	EMAIL: Mail,
	SLACK_WEBHOOK: MessageSquare,
	SLACK_APP: MessageSquare,
	DISCORD: MessageSquare,
	PAGERDUTY: Globe,
	OPSGENIE: Globe,
	WEBHOOK: Globe,
}

const channelLabels: Record<ChannelType, string> = {
	EMAIL: "Email",
	SLACK_WEBHOOK: "Slack",
	SLACK_APP: "Slack",
	DISCORD: "Discord",
	PAGERDUTY: "PagerDuty",
	OPSGENIE: "OpsGenie",
	WEBHOOK: "Webhook",
}

export function ChannelCard({ channel, onEdit }: ChannelCardProps) {
	const deleteChannel = useDeleteChannel()
	const testChannel = useTestChannel()
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const Icon = channelIcons[channel.type]

	function handleDelete() {
		deleteChannel.mutate(
			{ projectId: channel.projectId, channelId: channel.id },
			{
				onSuccess: () => {
					toast.success("Channel deleted")
					setShowDeleteConfirm(false)
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	function handleTest() {
		testChannel.mutate(
			{ projectId: channel.projectId, channelId: channel.id },
			{
				onSuccess: (result) => {
					if (result.success) {
						toast.success("Test notification sent")
					} else {
						toast.error(result.error || "Test failed")
					}
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	function getConfigSummary(): string {
		switch (channel.type) {
			case "EMAIL":
				return (channel.config.email as string) ?? "No email set"
			case "SLACK_WEBHOOK":
			case "SLACK_APP":
			case "DISCORD":
				return "Webhook configured"
			case "PAGERDUTY":
			case "OPSGENIE":
			case "WEBHOOK":
				return (channel.config.url as string) ?? "No URL set"
			default:
				return ""
		}
	}

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center gap-3 pb-2">
					<div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
						<Icon className="h-5 w-5 text-muted-foreground" />
					</div>
					<div className="flex-1 min-w-0">
						<CardTitle className="text-base truncate">{channel.name}</CardTitle>
						<p className="text-xs text-muted-foreground">
							{channelLabels[channel.type]}
						</p>
					</div>
					<div className="flex gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleTest}
							disabled={testChannel.isPending}
							title="Send test notification"
						>
							{testChannel.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Play className="h-4 w-4" />
							)}
						</Button>
						<Button variant="ghost" size="icon" onClick={() => onEdit(channel)}>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setShowDeleteConfirm(true)}
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground truncate">
						{getConfigSummary()}
					</p>
				</CardContent>
			</Card>

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				title="Delete channel"
				description={`Are you sure you want to delete "${channel.name}"? This cannot be undone.`}
				confirmLabel="Delete"
				variant="destructive"
				onConfirm={handleDelete}
			/>
		</>
	)
}
