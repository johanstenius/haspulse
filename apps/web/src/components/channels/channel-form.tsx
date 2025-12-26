"use client"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { Channel, ChannelType, CreateChannelData } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

const channelFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	type: z.enum(["EMAIL", "SLACK_WEBHOOK", "WEBHOOK"]),
	email: z.string().email("Invalid email").optional().or(z.literal("")),
	webhookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
	webhookSecret: z.string().optional(),
})

type ChannelFormValues = z.infer<typeof channelFormSchema>
type FormChannelType = ChannelFormValues["type"]

function toFormType(type: ChannelType | undefined): FormChannelType {
	if (type === "EMAIL" || type === "SLACK_WEBHOOK" || type === "WEBHOOK") {
		return type
	}
	return "EMAIL"
}

type ChannelFormProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: CreateChannelData) => void
	channel?: Channel
	isLoading?: boolean
}

export function ChannelForm({
	open,
	onOpenChange,
	onSubmit,
	channel,
	isLoading,
}: ChannelFormProps) {
	const form = useForm<ChannelFormValues>({
		defaultValues: {
			name: "",
			type: "EMAIL",
			email: "",
			webhookUrl: "",
			webhookSecret: "",
		},
	})

	const isEdit = !!channel
	const type = useWatch({ control: form.control, name: "type" })

	useEffect(() => {
		if (open) {
			form.reset({
				name: channel?.name ?? "",
				type: toFormType(channel?.type),
				email: (channel?.config.email as string) ?? "",
				webhookUrl:
					(channel?.config.webhookUrl as string) ??
					(channel?.config.url as string) ??
					"",
				webhookSecret: (channel?.config.secret as string) ?? "",
			})
		}
	}, [open, channel, form])

	function handleSubmit(values: ChannelFormValues) {
		const result = channelFormSchema.safeParse(values)
		if (!result.success) {
			for (const issue of result.error.issues) {
				const path = issue.path[0] as keyof ChannelFormValues
				form.setError(path, { message: issue.message })
			}
			return
		}

		let config: Record<string, unknown> = {}

		switch (result.data.type) {
			case "EMAIL":
				config = { email: result.data.email }
				break
			case "SLACK_WEBHOOK":
				config = { webhookUrl: result.data.webhookUrl }
				break
			case "WEBHOOK":
				config = {
					url: result.data.webhookUrl,
					secret: result.data.webhookSecret || undefined,
				}
				break
		}

		onSubmit({
			name: result.data.name,
			type: result.data.type as ChannelType,
			config,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit channel" : "Create channel"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update your notification channel."
							: "Add a new notification channel."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)}>
						<div className="space-y-4 py-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="My Channel" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={isEdit}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="EMAIL">Email</SelectItem>
												<SelectItem value="SLACK_WEBHOOK">Slack</SelectItem>
												<SelectItem value="WEBHOOK">Webhook</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{type === "EMAIL" && (
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email Address</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="alerts@example.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{type === "SLACK_WEBHOOK" && (
								<FormField
									control={form.control}
									name="webhookUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Webhook URL</FormLabel>
											<FormControl>
												<Input
													type="url"
													placeholder="https://hooks.slack.com/services/..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{type === "WEBHOOK" && (
								<>
									<FormField
										control={form.control}
										name="webhookUrl"
										render={({ field }) => (
											<FormItem>
												<FormLabel>URL</FormLabel>
												<FormControl>
													<Input
														type="url"
														placeholder="https://api.example.com/webhook"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="webhookSecret"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Secret (optional)</FormLabel>
												<FormControl>
													<Input
														placeholder="Used to sign webhook payloads"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</>
							)}
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{isEdit ? "Save" : "Create"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
