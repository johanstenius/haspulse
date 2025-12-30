"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type {
	CronJob,
	HttpMonitor,
	IncidentSeverity,
	IncidentStatus,
	IncidentWithUpdates,
	Maintenance,
	StatusPageComponent,
	StatusPageTheme,
} from "@/lib/api"
import {
	useActiveIncidents,
	useAddIncidentUpdate,
	useAddStatusPageComponent,
	useCreateIncident,
	useCreateMaintenance,
	useCreateStatusPage,
	useCronJobs,
	useDeleteIncident,
	useDeleteMaintenance,
	useHttpMonitors,
	useRemoveStatusPageComponent,
	useReorderStatusPageComponents,
	useSetDomain,
	useStatusPage,
	useStatusPageComponents,
	useUpcomingMaintenances,
	useUpdateMaintenance,
	useUpdateStatusPage,
	useVerifyDomain,
} from "@/lib/query"
import { cn } from "@/lib/utils"
import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
	AlertTriangle,
	Calendar,
	Check,
	CheckCircle2,
	Copy,
	ExternalLink,
	Globe,
	GripVertical,
	Loader2,
	Plus,
	Trash2,
	Wrench,
	X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const COLOR_PRESETS = [
	{ name: "Emerald", value: "#10b981" },
	{ name: "Blue", value: "#3b82f6" },
	{ name: "Purple", value: "#8b5cf6" },
	{ name: "Orange", value: "#f97316" },
	{ name: "Pink", value: "#ec4899" },
] as const

type StatusPageFormValues = {
	slug: string
	name: string
	description: string
	accentColor: string
	theme: StatusPageTheme
	showUptime: boolean
	uptimeDays: number
	autoIncidents: boolean
}

type StatusPageTabProps = {
	projectId: string
	projectSlug: string
}

function getSeverityBadgeVariant(
	severity: IncidentSeverity,
): "destructive" | "default" | "secondary" {
	switch (severity) {
		case "CRITICAL":
			return "destructive"
		case "MAJOR":
			return "default"
		default:
			return "secondary"
	}
}

function getStatusBadgeVariant(
	status: IncidentStatus,
): "destructive" | "default" | "secondary" | "outline" {
	switch (status) {
		case "INVESTIGATING":
			return "destructive"
		case "IDENTIFIED":
			return "default"
		case "MONITORING":
			return "secondary"
		default:
			return "outline"
	}
}

function formatRelativeTime(date: string): string {
	const now = new Date()
	const then = new Date(date)
	const diffMs = now.getTime() - then.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMins / 60)
	const diffDays = Math.floor(diffHours / 24)

	if (diffMins < 1) return "Just now"
	if (diffMins < 60) return `${diffMins}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays < 7) return `${diffDays}d ago`
	return then.toLocaleDateString()
}

function formatDateTime(date: string): string {
	return new Date(date).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

type SortableComponentProps = {
	component: StatusPageComponent
	cronJobs: CronJob[]
	httpMonitors: HttpMonitor[]
	onRemove: (componentId: string) => void
}

function SortableComponent({
	component,
	cronJobs,
	httpMonitors,
	onRemove,
}: SortableComponentProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: component.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	const monitor = component.cronJobId
		? cronJobs.find((cj) => cj.id === component.cronJobId)
		: httpMonitors.find((hm) => hm.id === component.httpMonitorId)
	const type = component.cronJobId ? "Cron Job" : "HTTP Monitor"

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"flex items-center gap-3 p-3 rounded-lg bg-secondary/20",
				isDragging && "opacity-50 bg-secondary/40",
			)}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="cursor-grab touch-none"
			>
				<GripVertical className="h-4 w-4 text-muted-foreground" />
			</button>
			<Checkbox checked={true} onCheckedChange={() => onRemove(component.id)} />
			<span className="flex-1 font-medium">
				{component.displayName ?? monitor?.name ?? "Unknown"}
			</span>
			<span className="text-xs text-muted-foreground">{type}</span>
		</div>
	)
}

export function StatusPageTab({ projectId, projectSlug }: StatusPageTabProps) {
	const { data: statusPage, isLoading, error } = useStatusPage(projectId)
	const { data: componentsData } = useStatusPageComponents(projectId)
	const { data: cronJobsData } = useCronJobs(projectId, { limit: 100 })
	const { data: httpMonitorsData } = useHttpMonitors(projectId, { limit: 100 })
	const { data: activeIncidentsData } = useActiveIncidents(projectId)
	const { data: upcomingMaintenancesData } = useUpcomingMaintenances(projectId)

	const createStatusPage = useCreateStatusPage()
	const updateStatusPage = useUpdateStatusPage()
	const addComponent = useAddStatusPageComponent()
	const removeComponent = useRemoveStatusPageComponent()
	const reorderComponents = useReorderStatusPageComponents()
	const setDomain = useSetDomain()
	const verifyDomain = useVerifyDomain()
	const createIncident = useCreateIncident()
	const addIncidentUpdate = useAddIncidentUpdate()
	const deleteIncident = useDeleteIncident()
	const createMaintenance = useCreateMaintenance()
	const updateMaintenance = useUpdateMaintenance()
	const deleteMaintenance = useDeleteMaintenance()

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const [copied, setCopied] = useState(false)
	const [domainInput, setDomainInput] = useState("")
	const [domainError, setDomainError] = useState<string | null>(null)
	const [incidentDialogOpen, setIncidentDialogOpen] = useState(false)
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
	const [selectedIncident, setSelectedIncident] =
		useState<IncidentWithUpdates | null>(null)
	const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)

	// Incident form state
	const [incidentTitle, setIncidentTitle] = useState("")
	const [incidentSeverity, setIncidentSeverity] =
		useState<IncidentSeverity>("MAJOR")
	const [incidentMessage, setIncidentMessage] = useState("")
	const [incidentComponentIds, setIncidentComponentIds] = useState<string[]>([])

	// Update form state
	const [updateStatus, setUpdateStatus] =
		useState<IncidentStatus>("INVESTIGATING")
	const [updateMessage, setUpdateMessage] = useState("")

	// Maintenance form state
	const [maintenanceTitle, setMaintenanceTitle] = useState("")
	const [maintenanceDescription, setMaintenanceDescription] = useState("")
	const [maintenanceStart, setMaintenanceStart] = useState("")
	const [maintenanceEnd, setMaintenanceEnd] = useState("")
	const [maintenanceComponentIds, setMaintenanceComponentIds] = useState<
		string[]
	>([])

	const hasStatusPage = !!statusPage && !error
	const activeIncidents = activeIncidentsData?.incidents ?? []
	const upcomingMaintenances = upcomingMaintenancesData?.maintenances ?? []

	const form = useForm<StatusPageFormValues>({
		defaultValues: {
			slug: projectSlug,
			name: "",
			description: "",
			accentColor: "#10b981",
			theme: "SYSTEM",
			showUptime: true,
			uptimeDays: 90,
			autoIncidents: false,
		},
	})

	// Track if form has been initialized with server data
	const [formInitialized, setFormInitialized] = useState(false)

	// Sync form with server data when it loads
	useEffect(() => {
		if (statusPage && !formInitialized) {
			form.reset({
				slug: statusPage.slug,
				name: statusPage.name,
				description: statusPage.description ?? "",
				accentColor: statusPage.accentColor,
				theme: statusPage.theme,
				showUptime: statusPage.showUptime,
				uptimeDays: statusPage.uptimeDays,
				autoIncidents: statusPage.autoIncidents,
			})
			setDomainInput(statusPage.customDomain ?? "")
			setFormInitialized(true)
		}
	}, [statusPage, form, formInitialized])

	const components = componentsData?.components ?? []
	const cronJobs = cronJobsData?.cronJobs ?? []
	const httpMonitors = httpMonitorsData?.httpMonitors ?? []

	// Get IDs of monitors already added as components
	const addedCronJobIds = new Set(
		components.filter((c) => c.cronJobId).map((c) => c.cronJobId),
	)
	const addedHttpMonitorIds = new Set(
		components.filter((c) => c.httpMonitorId).map((c) => c.httpMonitorId),
	)

	// Available monitors (not yet added)
	const availableCronJobs = cronJobs.filter((cj) => !addedCronJobIds.has(cj.id))
	const availableHttpMonitors = httpMonitors.filter(
		(hm) => !addedHttpMonitorIds.has(hm.id),
	)

	function handleCreate() {
		createStatusPage.mutate(
			{
				projectId,
				data: {
					slug: projectSlug,
					name: `${projectSlug} Status`,
				},
			},
			{
				onSuccess: () => {
					toast.success("Status page created")
				},
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleSubmit(values: StatusPageFormValues) {
		updateStatusPage.mutate(
			{
				projectId,
				data: {
					slug: values.slug,
					name: values.name,
					description: values.description || null,
					accentColor: values.accentColor,
					theme: values.theme,
					showUptime: values.showUptime,
					uptimeDays: values.uptimeDays,
					autoIncidents: values.autoIncidents,
				},
			},
			{
				onSuccess: () => toast.success("Status page updated"),
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleAddComponent(
		type: "cronJob" | "httpMonitor",
		monitor: CronJob | HttpMonitor,
	) {
		addComponent.mutate(
			{
				projectId,
				data: {
					cronJobId: type === "cronJob" ? monitor.id : undefined,
					httpMonitorId: type === "httpMonitor" ? monitor.id : undefined,
					displayName: monitor.name,
				},
			},
			{
				onSuccess: () => toast.success("Component added"),
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleRemoveComponent(componentId: string) {
		removeComponent.mutate(
			{ projectId, componentId },
			{
				onSuccess: () => toast.success("Component removed"),
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return

		const oldIndex = components.findIndex((c) => c.id === active.id)
		const newIndex = components.findIndex((c) => c.id === over.id)

		if (oldIndex === -1 || newIndex === -1) return

		const reordered = arrayMove(components, oldIndex, newIndex)
		const componentIds = reordered.map((c) => c.id)

		reorderComponents.mutate(
			{ projectId, componentIds },
			{
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleCopyUrl() {
		const url = `${window.location.origin}/s/${statusPage?.slug ?? projectSlug}`
		navigator.clipboard.writeText(url)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	function handleSetDomain() {
		const domain = domainInput.trim()
		if (!domain) {
			setDomain.mutate(
				{ projectId, domain: null },
				{
					onSuccess: () => {
						toast.success("Custom domain removed")
						setDomainError(null)
					},
					onError: (err) => toast.error(err.message),
				},
			)
			return
		}

		// Basic domain validation
		const domainRegex =
			/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i
		if (!domainRegex.test(domain)) {
			setDomainError("Enter a valid domain (e.g., status.example.com)")
			return
		}

		setDomain.mutate(
			{ projectId, domain },
			{
				onSuccess: () => {
					toast.success("Custom domain set - add DNS records to verify")
					setDomainError(null)
				},
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleVerifyDomain() {
		verifyDomain.mutate(
			{ projectId },
			{
				onSuccess: (result) => {
					if (result.verified) {
						toast.success("Domain verified successfully!")
						setDomainError(null)
					} else {
						setDomainError(result.error ?? "Verification failed")
					}
				},
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleRemoveDomain() {
		setDomain.mutate(
			{ projectId, domain: null },
			{
				onSuccess: () => {
					toast.success("Custom domain removed")
					setDomainInput("")
					setDomainError(null)
				},
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function resetIncidentForm() {
		setIncidentTitle("")
		setIncidentSeverity("MAJOR")
		setIncidentMessage("")
		setIncidentComponentIds([])
	}

	function handleCreateIncident() {
		if (!incidentTitle || incidentComponentIds.length === 0) {
			toast.error("Title and at least one component required")
			return
		}
		createIncident.mutate(
			{
				projectId,
				data: {
					title: incidentTitle,
					severity: incidentSeverity,
					componentIds: incidentComponentIds,
					initialMessage: incidentMessage || undefined,
				},
			},
			{
				onSuccess: () => {
					toast.success("Incident created")
					setIncidentDialogOpen(false)
					resetIncidentForm()
				},
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleAddUpdate() {
		if (!selectedIncident || !updateMessage) return
		addIncidentUpdate.mutate(
			{
				projectId,
				incidentId: selectedIncident.id,
				data: { status: updateStatus, message: updateMessage },
			},
			{
				onSuccess: () => {
					toast.success("Update added")
					setUpdateDialogOpen(false)
					setSelectedIncident(null)
					setUpdateMessage("")
				},
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleDeleteIncident(incidentId: string) {
		deleteIncident.mutate(
			{ projectId, incidentId },
			{
				onSuccess: () => toast.success("Incident deleted"),
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function resetMaintenanceForm() {
		setMaintenanceTitle("")
		setMaintenanceDescription("")
		setMaintenanceStart("")
		setMaintenanceEnd("")
		setMaintenanceComponentIds([])
	}

	function handleCreateMaintenance() {
		if (!maintenanceTitle || !maintenanceStart || !maintenanceEnd) {
			toast.error("Title, start time, and end time required")
			return
		}
		createMaintenance.mutate(
			{
				projectId,
				data: {
					title: maintenanceTitle,
					description: maintenanceDescription || undefined,
					componentIds: maintenanceComponentIds,
					scheduledFor: new Date(maintenanceStart).toISOString(),
					expectedEnd: new Date(maintenanceEnd).toISOString(),
				},
			},
			{
				onSuccess: () => {
					toast.success("Maintenance scheduled")
					setMaintenanceDialogOpen(false)
					resetMaintenanceForm()
				},
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleCompleteMaintenance(maintenanceId: string) {
		updateMaintenance.mutate(
			{
				projectId,
				maintenanceId,
				data: { status: "COMPLETED" },
			},
			{
				onSuccess: () => toast.success("Maintenance marked complete"),
				onError: (err) => toast.error(err.message),
			},
		)
	}

	function handleDeleteMaintenance(maintenanceId: string) {
		deleteMaintenance.mutate(
			{ projectId, maintenanceId },
			{
				onSuccess: () => toast.success("Maintenance deleted"),
				onError: (err) => toast.error(err.message),
			},
		)
	}

	if (isLoading || (hasStatusPage && !formInitialized)) {
		return <Skeleton className="h-96" />
	}

	if (!hasStatusPage) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Status Page</CardTitle>
					<CardDescription>
						Create a public status page for your customers to check service
						health.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button onClick={handleCreate} disabled={createStatusPage.isPending}>
						{createStatusPage.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Enable Status Page
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-6">
			{/* URL Card */}
			<Card>
				<CardHeader>
					<CardTitle>Public URL</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						<Input
							value={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${statusPage.slug}`}
							readOnly
							className="font-mono text-sm"
						/>
						<Button variant="outline" size="icon" onClick={handleCopyUrl}>
							{copied ? (
								<Check className="h-4 w-4" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</Button>
						<Button variant="outline" size="icon" asChild>
							<a
								href={`/s/${statusPage.slug}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="h-4 w-4" />
							</a>
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Settings Form */}
			<Card>
				<CardHeader>
					<CardTitle>Settings</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleSubmit)}
							className="space-y-6"
						>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Page Name</FormLabel>
										<FormControl>
											<Input placeholder="My Service Status" {...field} />
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
											<Input placeholder="my-service" {...field} />
										</FormControl>
										<FormDescription>
											Used in URL: /s/{field.value || "..."}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description (optional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Status page for our services"
												rows={2}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="accentColor"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Accent Color</FormLabel>
										<FormDescription>
											Used for the "All Systems Operational" banner and status
											indicators on the public page
										</FormDescription>
										<div className="flex flex-wrap gap-2">
											{COLOR_PRESETS.map((preset) => (
												<button
													key={preset.value}
													type="button"
													className={cn(
														"w-8 h-8 rounded-full border-2 transition-all",
														field.value === preset.value
															? "border-foreground scale-110"
															: "border-transparent hover:scale-105",
													)}
													style={{ backgroundColor: preset.value }}
													onClick={() => field.onChange(preset.value)}
													title={preset.name}
												/>
											))}
											<Input
												type="color"
												value={field.value}
												onChange={(e) => field.onChange(e.target.value)}
												className="w-8 h-8 p-0 border-0 cursor-pointer"
											/>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="theme"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Theme</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select theme" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="SYSTEM">System</SelectItem>
												<SelectItem value="LIGHT">Light</SelectItem>
												<SelectItem value="DARK">Dark</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="showUptime"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between">
										<div className="space-y-0.5">
											<FormLabel>Show Uptime</FormLabel>
											<FormDescription>
												Display uptime percentage for each component
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
								name="autoIncidents"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between">
										<div className="space-y-0.5">
											<FormLabel>Auto-create Incidents</FormLabel>
											<FormDescription>
												Automatically create incidents when monitors go down
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

							<Button type="submit" disabled={updateStatusPage.isPending}>
								{updateStatusPage.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Save Changes
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* Components Card */}
			<Card>
				<CardHeader>
					<CardTitle>Components</CardTitle>
					<CardDescription>
						Select which monitors appear on your status page. Drag to reorder.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{cronJobs.length === 0 && httpMonitors.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No monitors available. Create cron jobs or HTTP monitors first.
						</p>
					) : (
						<>
							{/* Selected components - sortable */}
							{components.length > 0 && (
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragEnd={handleDragEnd}
								>
									<SortableContext
										items={components.map((c) => c.id)}
										strategy={verticalListSortingStrategy}
									>
										<div className="space-y-1">
											{components.map((component) => (
												<SortableComponent
													key={component.id}
													component={component}
													cronJobs={cronJobs}
													httpMonitors={httpMonitors}
													onRemove={handleRemoveComponent}
												/>
											))}
										</div>
									</SortableContext>
								</DndContext>
							)}

							{/* Available monitors - not yet added */}
							{(availableCronJobs.length > 0 ||
								availableHttpMonitors.length > 0) && (
								<div className="space-y-1">
									{components.length > 0 && (
										<p className="text-xs text-muted-foreground pt-2">
											Available monitors
										</p>
									)}
									{availableCronJobs.map((cj) => {
										const checkboxId = `cron-${cj.id}`
										return (
											<div
												key={cj.id}
												className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30"
											>
												<Checkbox
													id={checkboxId}
													checked={false}
													onCheckedChange={() =>
														handleAddComponent("cronJob", cj)
													}
												/>
												<label
													htmlFor={checkboxId}
													className="flex-1 font-medium cursor-pointer"
												>
													{cj.name}
												</label>
												<span className="text-xs text-muted-foreground">
													Cron Job
												</span>
											</div>
										)
									})}
									{availableHttpMonitors.map((hm) => {
										const checkboxId = `http-${hm.id}`
										return (
											<div
												key={hm.id}
												className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30"
											>
												<Checkbox
													id={checkboxId}
													checked={false}
													onCheckedChange={() =>
														handleAddComponent("httpMonitor", hm)
													}
												/>
												<label
													htmlFor={checkboxId}
													className="flex-1 font-medium cursor-pointer"
												>
													{hm.name}
												</label>
												<span className="text-xs text-muted-foreground">
													HTTP Monitor
												</span>
											</div>
										)
									})}
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Incidents Card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							Incidents
						</CardTitle>
						<CardDescription>
							Manage active incidents on your status page
						</CardDescription>
					</div>
					<Dialog
						open={incidentDialogOpen}
						onOpenChange={setIncidentDialogOpen}
					>
						<DialogTrigger asChild>
							<Button size="sm">
								<Plus className="mr-2 h-4 w-4" />
								New Incident
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create Incident</DialogTitle>
								<DialogDescription>
									Report a new incident to your status page
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label>Title</Label>
									<Input
										placeholder="Service degradation..."
										value={incidentTitle}
										onChange={(e) => setIncidentTitle(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>Severity</Label>
									<Select
										value={incidentSeverity}
										onValueChange={(v) =>
											setIncidentSeverity(v as IncidentSeverity)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="MINOR">Minor</SelectItem>
											<SelectItem value="MAJOR">Major</SelectItem>
											<SelectItem value="CRITICAL">Critical</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Affected Components</Label>
									<div className="space-y-1 max-h-32 overflow-y-auto">
										{components.map((comp) => (
											<div key={comp.id} className="flex items-center gap-2">
												<Checkbox
													id={`incident-comp-${comp.id}`}
													checked={incidentComponentIds.includes(comp.id)}
													onCheckedChange={(checked) => {
														if (checked) {
															setIncidentComponentIds([
																...incidentComponentIds,
																comp.id,
															])
														} else {
															setIncidentComponentIds(
																incidentComponentIds.filter(
																	(id) => id !== comp.id,
																),
															)
														}
													}}
												/>
												<label
													htmlFor={`incident-comp-${comp.id}`}
													className="text-sm cursor-pointer"
												>
													{comp.displayName}
												</label>
											</div>
										))}
									</div>
								</div>
								<div className="space-y-2">
									<Label>Initial Message (optional)</Label>
									<Textarea
										placeholder="We are investigating..."
										value={incidentMessage}
										onChange={(e) => setIncidentMessage(e.target.value)}
										rows={3}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setIncidentDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									onClick={handleCreateIncident}
									disabled={createIncident.isPending}
								>
									{createIncident.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Create Incident
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{activeIncidents.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No active incidents. Your status page shows all systems
							operational.
						</p>
					) : (
						<div className="space-y-3">
							{activeIncidents.map((incident) => (
								<div
									key={incident.id}
									className="p-4 border rounded-lg space-y-2"
								>
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-2">
											<Badge
												variant={getSeverityBadgeVariant(incident.severity)}
											>
												{incident.severity}
											</Badge>
											<span className="font-medium">{incident.title}</span>
										</div>
										<div className="flex items-center gap-1">
											<Badge variant={getStatusBadgeVariant(incident.status)}>
												{incident.status}
											</Badge>
										</div>
									</div>
									<p className="text-xs text-muted-foreground">
										Started {formatRelativeTime(incident.startsAt)}
									</p>
									{incident.updates.length > 0 && (
										<div className="text-sm text-muted-foreground border-l-2 pl-3 mt-2">
											<p className="font-medium">
												Latest: {incident.updates[0].message}
											</p>
										</div>
									)}
									<div className="flex gap-2 pt-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setSelectedIncident(incident)
												setUpdateStatus(incident.status)
												setUpdateDialogOpen(true)
											}}
										>
											Add Update
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleDeleteIncident(incident.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Update Incident Dialog */}
			<Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Update</DialogTitle>
						<DialogDescription>
							Post a status update for this incident
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Status</Label>
							<Select
								value={updateStatus}
								onValueChange={(v) => setUpdateStatus(v as IncidentStatus)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="INVESTIGATING">Investigating</SelectItem>
									<SelectItem value="IDENTIFIED">Identified</SelectItem>
									<SelectItem value="MONITORING">Monitoring</SelectItem>
									<SelectItem value="RESOLVED">Resolved</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Message</Label>
							<Textarea
								placeholder="Update message..."
								value={updateMessage}
								onChange={(e) => setUpdateMessage(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setUpdateDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleAddUpdate}
							disabled={addIncidentUpdate.isPending || !updateMessage}
						>
							{addIncidentUpdate.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Post Update
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Maintenances Card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Wrench className="h-5 w-5" />
							Scheduled Maintenance
						</CardTitle>
						<CardDescription>
							Schedule maintenance windows for your services
						</CardDescription>
					</div>
					<Dialog
						open={maintenanceDialogOpen}
						onOpenChange={setMaintenanceDialogOpen}
					>
						<DialogTrigger asChild>
							<Button size="sm">
								<Calendar className="mr-2 h-4 w-4" />
								Schedule
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Schedule Maintenance</DialogTitle>
								<DialogDescription>
									Plan a maintenance window for your services
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label>Title</Label>
									<Input
										placeholder="Database migration..."
										value={maintenanceTitle}
										onChange={(e) => setMaintenanceTitle(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>Description (optional)</Label>
									<Textarea
										placeholder="What will be done during this maintenance..."
										value={maintenanceDescription}
										onChange={(e) => setMaintenanceDescription(e.target.value)}
										rows={2}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Start Time</Label>
										<Input
											type="datetime-local"
											value={maintenanceStart}
											onChange={(e) => setMaintenanceStart(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label>End Time</Label>
										<Input
											type="datetime-local"
											value={maintenanceEnd}
											onChange={(e) => setMaintenanceEnd(e.target.value)}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label>Affected Components</Label>
									<div className="space-y-1 max-h-32 overflow-y-auto">
										{components.map((comp) => (
											<div key={comp.id} className="flex items-center gap-2">
												<Checkbox
													id={`maint-comp-${comp.id}`}
													checked={maintenanceComponentIds.includes(comp.id)}
													onCheckedChange={(checked) => {
														if (checked) {
															setMaintenanceComponentIds([
																...maintenanceComponentIds,
																comp.id,
															])
														} else {
															setMaintenanceComponentIds(
																maintenanceComponentIds.filter(
																	(id) => id !== comp.id,
																),
															)
														}
													}}
												/>
												<label
													htmlFor={`maint-comp-${comp.id}`}
													className="text-sm cursor-pointer"
												>
													{comp.displayName}
												</label>
											</div>
										))}
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setMaintenanceDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									onClick={handleCreateMaintenance}
									disabled={createMaintenance.isPending}
								>
									{createMaintenance.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Schedule
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{upcomingMaintenances.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No scheduled maintenance windows.
						</p>
					) : (
						<div className="space-y-3">
							{upcomingMaintenances.map((maintenance) => (
								<div
									key={maintenance.id}
									className="p-4 border rounded-lg space-y-2"
								>
									<div className="flex items-start justify-between">
										<span className="font-medium">{maintenance.title}</span>
										<Badge
											variant={
												maintenance.status === "IN_PROGRESS"
													? "default"
													: "secondary"
											}
										>
											{maintenance.status === "IN_PROGRESS"
												? "In Progress"
												: "Scheduled"}
										</Badge>
									</div>
									{maintenance.description && (
										<p className="text-sm text-muted-foreground">
											{maintenance.description}
										</p>
									)}
									<p className="text-xs text-muted-foreground">
										{formatDateTime(maintenance.scheduledFor)} -{" "}
										{formatDateTime(maintenance.expectedEnd)}
									</p>
									<div className="flex gap-2 pt-2">
										{maintenance.status !== "COMPLETED" && (
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													handleCompleteMaintenance(maintenance.id)
												}
											>
												<Check className="mr-2 h-4 w-4" />
												Complete
											</Button>
										)}
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleDeleteMaintenance(maintenance.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
