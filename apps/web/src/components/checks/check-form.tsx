"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
	FormDescription,
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
import { Switch } from "@/components/ui/switch"
import type { Channel, Check, CreateCheckData, ScheduleType } from "@/lib/api"
import { Globe, Loader2, Mail, MessageSquare } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

const checkFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z
		.string()
		.regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers, and dashes only")
		.optional()
		.or(z.literal("")),
	scheduleType: z.enum(["PERIOD", "CRON"]),
	scheduleValue: z.string().min(1, "Schedule value is required"),
	graceSeconds: z.coerce.number().min(0).max(86400),
	alertOnRecovery: z.boolean(),
	channelIds: z.array(z.string()),
})

type CheckFormValues = z.infer<typeof checkFormSchema>

type CheckFormProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: CreateCheckData & { channelIds?: string[] }) => void
	check?: Check
	channels?: Channel[]
	isLoading?: boolean
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}

const channelIcons = {
	EMAIL: Mail,
	SLACK: MessageSquare,
	WEBHOOK: Globe,
}

export function CheckForm({
	open,
	onOpenChange,
	onSubmit,
	check,
	channels = [],
	isLoading,
}: CheckFormProps) {
	const form = useForm<CheckFormValues>({
		defaultValues: {
			name: "",
			slug: "",
			scheduleType: "PERIOD",
			scheduleValue: "86400",
			graceSeconds: 300,
			alertOnRecovery: true,
			channelIds: [],
		},
	})

	const isEdit = !!check
	const name = useWatch({ control: form.control, name: "name" })
	const scheduleType = useWatch({ control: form.control, name: "scheduleType" })
	const slug = useWatch({ control: form.control, name: "slug" })

	useEffect(() => {
		if (open) {
			form.reset({
				name: check?.name ?? "",
				slug: check?.slug ?? "",
				scheduleType: check?.scheduleType ?? "PERIOD",
				scheduleValue: check?.scheduleValue ?? "86400",
				graceSeconds: check?.graceSeconds ?? 300,
				alertOnRecovery: check?.alertOnRecovery ?? true,
				channelIds: check?.channelIds ?? [],
			})
		}
	}, [open, check, form])

	// Auto-generate slug from name when creating
	useEffect(() => {
		if (!isEdit && name && !form.formState.dirtyFields.slug) {
			form.setValue("slug", slugify(name))
		}
	}, [name, isEdit, form])

	function handleSubmit(values: CheckFormValues) {
		const result = checkFormSchema.safeParse(values)
		if (!result.success) {
			for (const issue of result.error.issues) {
				const path = issue.path[0] as keyof CheckFormValues
				form.setError(path, { message: issue.message })
			}
			return
		}
		onSubmit({
			name: result.data.name,
			slug: result.data.slug || undefined,
			scheduleType: result.data.scheduleType as ScheduleType,
			scheduleValue: result.data.scheduleValue,
			graceSeconds: result.data.graceSeconds,
			alertOnRecovery: result.data.alertOnRecovery,
			channelIds: result.data.channelIds,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEdit ? "Edit check" : "Create check"}</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update your check configuration."
							: "Configure a new monitoring check."}
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
											<Input placeholder="Daily backup" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="slug"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Slug (optional)</FormLabel>
										<FormControl>
											<Input placeholder="daily-backup" {...field} />
										</FormControl>
										<FormDescription>
											Ping URL: haspulse.dev/p/{slug || "<check-id>"}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="scheduleType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Schedule Type</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="PERIOD">Period</SelectItem>
													<SelectItem value="CRON">Cron</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="scheduleValue"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{scheduleType === "PERIOD"
													? "Interval (seconds)"
													: "Cron Expression"}
											</FormLabel>
											<FormControl>
												<Input
													placeholder={
														scheduleType === "PERIOD" ? "86400" : "0 3 * * *"
													}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="graceSeconds"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Grace Period (seconds)</FormLabel>
										<FormControl>
											<Input type="number" min="0" max="86400" {...field} />
										</FormControl>
										<FormDescription>
											Extra time before marking as late/down
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="alertOnRecovery"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between">
										<div className="space-y-0.5">
											<FormLabel>Alert on recovery</FormLabel>
											<FormDescription>
												Get notified when check recovers
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{channels.length > 0 && (
								<FormField
									control={form.control}
									name="channelIds"
									render={() => (
										<FormItem>
											<FormLabel>Notification Channels</FormLabel>
											<FormDescription>
												Select channels to notify when this check fails
											</FormDescription>
											<div className="space-y-2 mt-2">
												{channels.map((channel) => {
													const Icon = channelIcons[channel.type]
													return (
														<FormField
															key={channel.id}
															control={form.control}
															name="channelIds"
															render={({ field }) => (
																<FormItem className="flex items-center gap-3 space-y-0">
																	<FormControl>
																		<Checkbox
																			checked={field.value?.includes(
																				channel.id,
																			)}
																			onCheckedChange={(checked) => {
																				const current = field.value ?? []
																				if (checked) {
																					field.onChange([
																						...current,
																						channel.id,
																					])
																				} else {
																					field.onChange(
																						current.filter(
																							(id) => id !== channel.id,
																						),
																					)
																				}
																			}}
																		/>
																	</FormControl>
																	<div className="flex items-center gap-2">
																		<Icon className="h-4 w-4 text-muted-foreground" />
																		<span className="text-sm">
																			{channel.name}
																		</span>
																	</div>
																</FormItem>
															)}
														/>
													)
												})}
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
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
