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
import { Textarea } from "@/components/ui/textarea"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
	Channel,
	CreateHttpMonitorData,
	HttpMethod,
	HttpMonitor,
} from "@/lib/api"
import { Globe, Info, Loader2, Mail, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

const httpMonitorFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	url: z.string().url("Must be a valid URL"),
	method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]),
	headers: z.string().optional(),
	body: z.string().optional(),
	timeout: z.coerce.number().min(1).max(120),
	expectedStatus: z.coerce.number().min(100).max(599),
	expectedBody: z.string().optional(),
	interval: z.coerce.number().min(30).max(3600),
	graceSeconds: z.coerce.number().min(0).max(3600),
	alertOnRecovery: z.boolean(),
	channelIds: z.array(z.string()),
})

type HttpMonitorFormValues = z.infer<typeof httpMonitorFormSchema>

const INTERVAL_PRESETS = [
	{ label: "30s", seconds: 30 },
	{ label: "1 min", seconds: 60 },
	{ label: "5 min", seconds: 300 },
	{ label: "15 min", seconds: 900 },
	{ label: "1 hour", seconds: 3600 },
] as const

const GRACE_PRESETS = [
	{ label: "30s", seconds: 30 },
	{ label: "1 min", seconds: 60 },
	{ label: "5 min", seconds: 300 },
] as const

type HttpMonitorFormProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: CreateHttpMonitorData & { channelIds?: string[] }) => void
	httpMonitor?: HttpMonitor
	channels?: Channel[]
	isLoading?: boolean
}

const channelIcons: Record<string, typeof Mail> = {
	EMAIL: Mail,
	SLACK_WEBHOOK: MessageSquare,
	SLACK_APP: MessageSquare,
	DISCORD: MessageSquare,
	PAGERDUTY: Globe,
	OPSGENIE: Globe,
	WEBHOOK: Globe,
}

function parseHeaders(headersStr: string): Record<string, string> | undefined {
	if (!headersStr.trim()) return undefined
	try {
		return JSON.parse(headersStr)
	} catch {
		return undefined
	}
}

function stringifyHeaders(headers: Record<string, string> | null): string {
	if (!headers) return ""
	return JSON.stringify(headers, null, 2)
}

export function HttpMonitorForm({
	open,
	onOpenChange,
	onSubmit,
	httpMonitor,
	channels = [],
	isLoading,
}: HttpMonitorFormProps) {
	const form = useForm<HttpMonitorFormValues>({
		defaultValues: {
			name: "",
			url: "",
			method: "GET",
			headers: "",
			body: "",
			timeout: 30,
			expectedStatus: 200,
			expectedBody: "",
			interval: 60,
			graceSeconds: 60,
			alertOnRecovery: true,
			channelIds: [],
		},
	})

	const isEdit = !!httpMonitor
	const method = useWatch({ control: form.control, name: "method" })
	const interval = useWatch({ control: form.control, name: "interval" })
	const graceSeconds = useWatch({ control: form.control, name: "graceSeconds" })

	const [showAdvanced, setShowAdvanced] = useState(false)

	const isCustomInterval = !INTERVAL_PRESETS.some((p) => p.seconds === interval)
	const isCustomGrace = !GRACE_PRESETS.some((p) => p.seconds === graceSeconds)

	useEffect(() => {
		if (open) {
			const hasAdvanced =
				httpMonitor?.headers || httpMonitor?.body || httpMonitor?.expectedBody
			setShowAdvanced(!!hasAdvanced)

			form.reset({
				name: httpMonitor?.name ?? "",
				url: httpMonitor?.url ?? "",
				method: (httpMonitor?.method as HttpMethod) ?? "GET",
				headers: stringifyHeaders(httpMonitor?.headers ?? null),
				body: httpMonitor?.body ?? "",
				timeout: httpMonitor?.timeout ?? 30,
				expectedStatus: httpMonitor?.expectedStatus ?? 200,
				expectedBody: httpMonitor?.expectedBody ?? "",
				interval: httpMonitor?.interval ?? 60,
				graceSeconds: httpMonitor?.graceSeconds ?? 60,
				alertOnRecovery: httpMonitor?.alertOnRecovery ?? true,
				channelIds: httpMonitor?.channelIds ?? [],
			})
		}
	}, [open, httpMonitor, form])

	function handleSubmit(values: HttpMonitorFormValues) {
		const result = httpMonitorFormSchema.safeParse(values)
		if (!result.success) {
			for (const issue of result.error.issues) {
				const path = issue.path[0] as keyof HttpMonitorFormValues
				form.setError(path, { message: issue.message })
			}
			return
		}

		const headers = parseHeaders(result.data.headers ?? "")

		onSubmit({
			name: result.data.name,
			url: result.data.url,
			method: result.data.method as HttpMethod,
			headers,
			body: result.data.body || undefined,
			timeout: result.data.timeout,
			expectedStatus: result.data.expectedStatus,
			expectedBody: result.data.expectedBody || undefined,
			interval: result.data.interval,
			graceSeconds: result.data.graceSeconds,
			alertOnRecovery: result.data.alertOnRecovery,
			channelIds: result.data.channelIds,
		})
	}

	const showBody = ["POST", "PUT", "PATCH"].includes(method)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit HTTP monitor" : "Create HTTP monitor"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update your HTTP monitor configuration."
							: "Monitor an HTTP endpoint for availability and response time."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)}>
						<div className="space-y-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="API Health Check" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex gap-3">
								<FormField
									control={form.control}
									name="method"
									render={({ field }) => (
										<FormItem className="w-28">
											<FormLabel>Method</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="GET">GET</SelectItem>
													<SelectItem value="POST">POST</SelectItem>
													<SelectItem value="PUT">PUT</SelectItem>
													<SelectItem value="PATCH">PATCH</SelectItem>
													<SelectItem value="DELETE">DELETE</SelectItem>
													<SelectItem value="HEAD">HEAD</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="url"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormLabel>URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://api.example.com/health"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex gap-4">
								<FormField
									control={form.control}
									name="expectedStatus"
									render={({ field }) => (
										<FormItem className="w-28">
											<FormLabel>Expected</FormLabel>
											<FormControl>
												<Input type="number" min={100} max={599} {...field} />
											</FormControl>
											<FormDescription>Status code</FormDescription>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="timeout"
									render={({ field }) => (
										<FormItem className="w-28">
											<FormLabel>Timeout</FormLabel>
											<FormControl>
												<Input type="number" min={1} max={120} {...field} />
											</FormControl>
											<FormDescription>Seconds</FormDescription>
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="interval"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center gap-1.5">
											<FormLabel>Check Interval</FormLabel>
											<Tooltip>
												<TooltipTrigger asChild>
													<Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
												</TooltipTrigger>
												<TooltipContent side="right" className="max-w-[200px]">
													How often to check this endpoint
												</TooltipContent>
											</Tooltip>
										</div>
										<div className="flex flex-wrap gap-2">
											{INTERVAL_PRESETS.map((preset) => (
												<Button
													key={preset.seconds}
													type="button"
													variant={
														field.value === preset.seconds
															? "default"
															: "outline"
													}
													size="sm"
													className="text-xs"
													onClick={() => field.onChange(preset.seconds)}
												>
													{preset.label}
												</Button>
											))}
											{isCustomInterval && (
												<Input
													type="number"
													min={30}
													max={3600}
													value={field.value}
													onChange={(e) =>
														field.onChange(Number(e.target.value))
													}
													className="w-20 h-8 text-xs"
												/>
											)}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="graceSeconds"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center gap-1.5">
											<FormLabel>Grace Period</FormLabel>
											<Tooltip>
												<TooltipTrigger asChild>
													<Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
												</TooltipTrigger>
												<TooltipContent side="right" className="max-w-[200px]">
													Time before marking as DOWN after failures
												</TooltipContent>
											</Tooltip>
										</div>
										<div className="flex flex-wrap gap-2">
											{GRACE_PRESETS.map((preset) => (
												<Button
													key={preset.seconds}
													type="button"
													variant={
														field.value === preset.seconds
															? "default"
															: "outline"
													}
													size="sm"
													className="text-xs"
													onClick={() => field.onChange(preset.seconds)}
												>
													{preset.label}
												</Button>
											))}
											{isCustomGrace && (
												<Input
													type="number"
													min={0}
													max={3600}
													value={field.value}
													onChange={(e) =>
														field.onChange(Number(e.target.value))
													}
													className="w-20 h-8 text-xs"
												/>
											)}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<button
								type="button"
								className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/50 hover:decoration-foreground transition-colors"
								onClick={() => setShowAdvanced(!showAdvanced)}
							>
								{showAdvanced ? "Hide" : "Show"} advanced options
							</button>

							{showAdvanced && (
								<div className="space-y-6 border-t border-border pt-6">
									<FormField
										control={form.control}
										name="headers"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Headers (JSON)</FormLabel>
												<FormControl>
													<Textarea
														placeholder='{"Authorization": "Bearer xxx"}'
														className="font-mono text-xs"
														rows={3}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{showBody && (
										<FormField
											control={form.control}
											name="body"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Request Body</FormLabel>
													<FormControl>
														<Textarea
															placeholder='{"key": "value"}'
															className="font-mono text-xs"
															rows={3}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}

									<FormField
										control={form.control}
										name="expectedBody"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Expected Body Contains</FormLabel>
												<FormControl>
													<Input
														placeholder='"status":"ok"'
														className="font-mono text-xs"
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Response must contain this string
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							<FormField
								control={form.control}
								name="alertOnRecovery"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between">
										<div className="space-y-0.5">
											<FormLabel>Alert on recovery</FormLabel>
											<FormDescription>
												Get notified when endpoint recovers
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
												Select channels to notify when this monitor fails
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
