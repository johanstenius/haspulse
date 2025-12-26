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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
	AnomalySensitivity,
	Channel,
	Check,
	CreateCheckData,
	ScheduleType,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import cronstrue from "cronstrue"
import { Clock, Globe, Info, Loader2, Mail, MessageSquare } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
	anomalySensitivity: z.enum(["LOW", "NORMAL", "HIGH"]),
	channelIds: z.array(z.string()),
})

type CheckFormValues = z.infer<typeof checkFormSchema>

const PERIOD_PRESETS = [
	{ label: "1 min", seconds: 60 },
	{ label: "5 min", seconds: 300 },
	{ label: "15 min", seconds: 900 },
	{ label: "1 hour", seconds: 3600 },
	{ label: "12 hours", seconds: 43200 },
	{ label: "1 day", seconds: 86400 },
] as const

const CRON_PRESETS = [
	{ label: "Hourly", cron: "0 * * * *" },
	{ label: "Daily (midnight)", cron: "0 0 * * *" },
	{ label: "Daily (9am)", cron: "0 9 * * *" },
	{ label: "Weekly (Mon)", cron: "0 9 * * 1" },
	{ label: "Monthly", cron: "0 0 1 * *" },
] as const

const GRACE_PRESETS = [
	{ label: "1 min", seconds: 60 },
	{ label: "5 min", seconds: 300 },
	{ label: "15 min", seconds: 900 },
	{ label: "30 min", seconds: 1800 },
	{ label: "1 hour", seconds: 3600 },
] as const

const DURATION_UNITS = [
	{ label: "seconds", value: "seconds", multiplier: 1 },
	{ label: "minutes", value: "minutes", multiplier: 60 },
	{ label: "hours", value: "hours", multiplier: 3600 },
	{ label: "days", value: "days", multiplier: 86400 },
] as const

type DurationUnit = (typeof DURATION_UNITS)[number]["value"]

function secondsToUnit(seconds: number): { value: number; unit: DurationUnit } {
	if (seconds <= 0) return { value: 0, unit: "minutes" }
	if (seconds % 86400 === 0) return { value: seconds / 86400, unit: "days" }
	if (seconds % 3600 === 0) return { value: seconds / 3600, unit: "hours" }
	if (seconds % 60 === 0) return { value: seconds / 60, unit: "minutes" }
	return { value: seconds, unit: "seconds" }
}

function unitToSeconds(value: number, unit: DurationUnit): number {
	const unitDef = DURATION_UNITS.find((u) => u.value === unit)
	return value * (unitDef?.multiplier ?? 1)
}

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
	if (seconds < 86400) {
		const hours = Math.floor(seconds / 3600)
		return hours === 1 ? "1 hour" : `${hours} hours`
	}
	const days = Math.floor(seconds / 86400)
	return days === 1 ? "1 day" : `${days} days`
}

function parseCronDescription(cron: string): string | null {
	try {
		return cronstrue.toString(cron, { verbose: false })
	} catch {
		return null
	}
}

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
			anomalySensitivity: "NORMAL",
			channelIds: [],
		},
	})

	const isEdit = !!check
	const name = useWatch({ control: form.control, name: "name" })
	const scheduleType = useWatch({ control: form.control, name: "scheduleType" })
	const scheduleValue = useWatch({
		control: form.control,
		name: "scheduleValue",
	})
	const graceSeconds = useWatch({ control: form.control, name: "graceSeconds" })
	const slug = useWatch({ control: form.control, name: "slug" })

	const scheduleDescription = useMemo(() => {
		if (scheduleType === "CRON") {
			return parseCronDescription(scheduleValue)
		}
		const seconds = Number.parseInt(scheduleValue, 10)
		if (Number.isNaN(seconds) || seconds <= 0) return null
		return `Every ${formatDuration(seconds)}`
	}, [scheduleType, scheduleValue])

	const isCustomPeriod =
		scheduleType === "PERIOD" &&
		!PERIOD_PRESETS.some(
			(p) => p.seconds === Number.parseInt(scheduleValue, 10),
		)

	const isCustomCron =
		scheduleType === "CRON" &&
		!CRON_PRESETS.some((p) => p.cron === scheduleValue)

	const isCustomGrace = !GRACE_PRESETS.some((p) => p.seconds === graceSeconds)

	// State for custom duration inputs (value + unit)
	const [customPeriod, setCustomPeriod] = useState({
		value: 1,
		unit: "hours" as DurationUnit,
	})
	const [customGrace, setCustomGrace] = useState({
		value: 5,
		unit: "minutes" as DurationUnit,
	})

	useEffect(() => {
		if (open) {
			const periodSeconds = Number.parseInt(check?.scheduleValue ?? "86400", 10)
			const graceSecondsVal = check?.graceSeconds ?? 300

			// Set custom period state if it's a custom value
			if (
				check?.scheduleType === "PERIOD" &&
				!PERIOD_PRESETS.some((p) => p.seconds === periodSeconds)
			) {
				setCustomPeriod(secondsToUnit(periodSeconds))
			}

			// Set custom grace state if it's a custom value
			if (!GRACE_PRESETS.some((p) => p.seconds === graceSecondsVal)) {
				setCustomGrace(secondsToUnit(graceSecondsVal))
			}

			form.reset({
				name: check?.name ?? "",
				slug: check?.slug ?? "",
				scheduleType: check?.scheduleType ?? "PERIOD",
				scheduleValue: check?.scheduleValue ?? "86400",
				graceSeconds: check?.graceSeconds ?? 300,
				alertOnRecovery: check?.alertOnRecovery ?? true,
				anomalySensitivity: check?.anomalySensitivity ?? "NORMAL",
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
			anomalySensitivity: result.data.anomalySensitivity as AnomalySensitivity,
			channelIds: result.data.channelIds,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
						<div className="space-y-6 py-4">
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
										<FormLabel>Slug</FormLabel>
										<FormControl>
											<Input placeholder="daily-backup" {...field} />
										</FormControl>
										<FormDescription>
											Used for pings: /ping/{slug || "<slug>"}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="space-y-3">
								<FormField
									control={form.control}
									name="scheduleType"
									render={({ field }) => (
										<FormItem>
											<div className="flex items-center gap-1.5">
												<FormLabel>Schedule</FormLabel>
												<Tooltip>
													<TooltipTrigger asChild>
														<Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
													</TooltipTrigger>
													<TooltipContent
														side="right"
														className="max-w-[220px]"
													>
														{field.value === "PERIOD"
															? "Expects ping within interval from last ping. Use for jobs that run at fixed intervals."
															: "Expects pings at specific times. Use for jobs scheduled via cron."}
													</TooltipContent>
												</Tooltip>
											</div>
											<div className="flex gap-2">
												<Button
													type="button"
													variant={
														field.value === "PERIOD" ? "default" : "outline"
													}
													size="sm"
													onClick={() => {
														field.onChange("PERIOD")
														form.setValue("scheduleValue", "86400")
													}}
												>
													Interval
												</Button>
												<Button
													type="button"
													variant={
														field.value === "CRON" ? "default" : "outline"
													}
													size="sm"
													onClick={() => {
														field.onChange("CRON")
														form.setValue("scheduleValue", "0 * * * *")
													}}
												>
													Cron
												</Button>
											</div>
										</FormItem>
									)}
								/>

								{scheduleType === "PERIOD" ? (
									<FormField
										control={form.control}
										name="scheduleValue"
										render={({ field }) => (
											<FormItem>
												<div className="flex flex-wrap gap-2">
													{PERIOD_PRESETS.map((preset) => (
														<Button
															key={preset.seconds}
															type="button"
															variant={
																field.value === String(preset.seconds)
																	? "default"
																	: "outline"
															}
															size="sm"
															className="text-xs"
															onClick={() =>
																field.onChange(String(preset.seconds))
															}
														>
															{preset.label}
														</Button>
													))}
													<Button
														type="button"
														variant={isCustomPeriod ? "default" : "outline"}
														size="sm"
														className="text-xs"
														onClick={() => {
															const current = Number.parseInt(field.value, 10)
															if (
																!PERIOD_PRESETS.some(
																	(p) => p.seconds === current,
																)
															) {
																return
															}
															// Initialize custom state and set form value
															setCustomPeriod({ value: 1, unit: "hours" })
															field.onChange(String(unitToSeconds(1, "hours")))
														}}
													>
														Custom
													</Button>
												</div>
												{isCustomPeriod && (
													<div className="flex gap-2 mt-2">
														<FormControl>
															<Input
																type="number"
																min="1"
																value={customPeriod.value}
																onChange={(e) => {
																	const val =
																		Number.parseInt(e.target.value, 10) || 0
																	setCustomPeriod((prev) => ({
																		...prev,
																		value: val,
																	}))
																	field.onChange(
																		String(
																			unitToSeconds(val, customPeriod.unit),
																		),
																	)
																}}
																className="w-24"
															/>
														</FormControl>
														<Select
															value={customPeriod.unit}
															onValueChange={(unit: DurationUnit) => {
																setCustomPeriod((prev) => ({ ...prev, unit }))
																field.onChange(
																	String(
																		unitToSeconds(customPeriod.value, unit),
																	),
																)
															}}
														>
															<SelectTrigger className="w-28">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{DURATION_UNITS.map((u) => (
																	<SelectItem key={u.value} value={u.value}>
																		{u.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
												)}
												{scheduleDescription && (
													<div className="flex items-center gap-1.5 text-xs text-emerald-500 mt-2">
														<Clock className="h-3 w-3" />
														{scheduleDescription}
													</div>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>
								) : (
									<FormField
										control={form.control}
										name="scheduleValue"
										render={({ field }) => (
											<FormItem>
												<div className="flex flex-wrap gap-2">
													{CRON_PRESETS.map((preset) => (
														<Button
															key={preset.cron}
															type="button"
															variant={
																field.value === preset.cron
																	? "default"
																	: "outline"
															}
															size="sm"
															className="text-xs"
															onClick={() => field.onChange(preset.cron)}
														>
															{preset.label}
														</Button>
													))}
													<Button
														type="button"
														variant={isCustomCron ? "default" : "outline"}
														size="sm"
														className="text-xs"
														onClick={() => {
															if (
																!CRON_PRESETS.some(
																	(p) => p.cron === field.value,
																)
															) {
																return
															}
															field.onChange("")
														}}
													>
														Custom
													</Button>
												</div>
												{isCustomCron && (
													<FormControl>
														<Input
															placeholder="0 * * * *"
															className="mt-2"
															{...field}
														/>
													</FormControl>
												)}
												{scheduleDescription ? (
													<div className="flex items-center gap-1.5 text-xs text-emerald-500 mt-2">
														<Clock className="h-3 w-3" />
														{scheduleDescription}
													</div>
												) : (
													scheduleValue && (
														<div className="text-xs text-destructive mt-2">
															Invalid cron expression
														</div>
													)
												)}
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</div>

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
													Extra time allowed before marking as late/down
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
											<Button
												type="button"
												variant={isCustomGrace ? "default" : "outline"}
												size="sm"
												className="text-xs"
												onClick={() => {
													if (
														!GRACE_PRESETS.some(
															(p) => p.seconds === field.value,
														)
													) {
														return
													}
													// Initialize custom state and set form value
													setCustomGrace({ value: 10, unit: "minutes" })
													field.onChange(unitToSeconds(10, "minutes"))
												}}
											>
												Custom
											</Button>
										</div>
										{isCustomGrace && (
											<div className="flex gap-2 mt-2">
												<FormControl>
													<Input
														type="number"
														min="0"
														value={customGrace.value}
														onChange={(e) => {
															const val =
																Number.parseInt(e.target.value, 10) || 0
															setCustomGrace((prev) => ({
																...prev,
																value: val,
															}))
															field.onChange(
																unitToSeconds(val, customGrace.unit),
															)
														}}
														className="w-24"
													/>
												</FormControl>
												<Select
													value={customGrace.unit}
													onValueChange={(unit: DurationUnit) => {
														setCustomGrace((prev) => ({ ...prev, unit }))
														field.onChange(
															unitToSeconds(customGrace.value, unit),
														)
													}}
												>
													<SelectTrigger className="w-28">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{DURATION_UNITS.map((u) => (
															<SelectItem key={u.value} value={u.value}>
																{u.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										)}
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

							<FormField
								control={form.control}
								name="anomalySensitivity"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center gap-1.5">
											<FormLabel>Anomaly Sensitivity</FormLabel>
											<Tooltip>
												<TooltipTrigger asChild>
													<Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
												</TooltipTrigger>
												<TooltipContent side="right" className="max-w-[280px]">
													<p className="font-medium mb-1">
														Duration anomaly detection
													</p>
													<p className="text-xs text-muted-foreground">
														Alerts when job duration deviates significantly from
														the 7-day baseline. Requires START + SUCCESS pings.
													</p>
												</TooltipContent>
											</Tooltip>
										</div>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="LOW">
													Low - Only major anomalies
												</SelectItem>
												<SelectItem value="NORMAL">
													Normal - Significant deviations
												</SelectItem>
												<SelectItem value="HIGH">
													High - Small deviations
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
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

						<DialogFooter className="mt-6">
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
