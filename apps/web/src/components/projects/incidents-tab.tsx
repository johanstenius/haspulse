"use client"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
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
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { Incident, IncidentImpact, IncidentStatus } from "@/lib/api"
import {
	useAddIncidentUpdate,
	useCreateIncident,
	useDeleteIncident,
	useIncident,
	useIncidents,
	useUpdateIncident,
} from "@/lib/query"
import { zodResolver } from "@hookform/resolvers/zod"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

type IncidentsTabProps = {
	projectId: string
}

const IMPACT_COLORS: Record<IncidentImpact, string> = {
	NONE: "bg-gray-100 text-gray-800",
	MINOR: "bg-yellow-100 text-yellow-800",
	MAJOR: "bg-orange-100 text-orange-800",
	CRITICAL: "bg-red-100 text-red-800",
}

const STATUS_ICONS: Record<IncidentStatus, string> = {
	INVESTIGATING: "search",
	IDENTIFIED: "alert",
	MONITORING: "clock",
	RESOLVED: "check",
}

function getStatusBadgeVariant(status: IncidentStatus) {
	switch (status) {
		case "RESOLVED":
			return "outline"
		case "MONITORING":
			return "secondary"
		default:
			return "default"
	}
}

const incidentFormSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	status: z.enum(["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]),
	impact: z.enum(["NONE", "MINOR", "MAJOR", "CRITICAL"]),
})

type IncidentFormData = z.infer<typeof incidentFormSchema>

const updateFormSchema = z.object({
	status: z.enum(["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]),
	message: z.string().min(1, "Message is required").max(2000),
})

type UpdateFormData = z.infer<typeof updateFormSchema>

function IncidentForm({
	projectId,
	incident,
	open,
	onOpenChange,
}: {
	projectId: string
	incident: Incident | null
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const createIncident = useCreateIncident()
	const updateIncident = useUpdateIncident()
	const isEdit = !!incident

	const form = useForm<IncidentFormData>({
		resolver: zodResolver(incidentFormSchema),
		defaultValues: {
			title: incident?.title ?? "",
			status: incident?.status ?? "INVESTIGATING",
			impact: incident?.impact ?? "MINOR",
		},
	})

	async function onSubmit(data: IncidentFormData) {
		try {
			if (isEdit) {
				await updateIncident.mutateAsync({
					projectId,
					incidentId: incident.id,
					data,
				})
				toast.success("Incident updated")
			} else {
				await createIncident.mutateAsync({ projectId, data })
				toast.success("Incident created")
			}
			form.reset()
			onOpenChange(false)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to save incident",
			)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isEdit ? "Edit Incident" : "New Incident"}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder="API degradation" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Status</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="INVESTIGATING">
													Investigating
												</SelectItem>
												<SelectItem value="IDENTIFIED">Identified</SelectItem>
												<SelectItem value="MONITORING">Monitoring</SelectItem>
												<SelectItem value="RESOLVED">Resolved</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="impact"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Impact</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="NONE">None</SelectItem>
												<SelectItem value="MINOR">Minor</SelectItem>
												<SelectItem value="MAJOR">Major</SelectItem>
												<SelectItem value="CRITICAL">Critical</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={createIncident.isPending || updateIncident.isPending}
							>
								{(createIncident.isPending || updateIncident.isPending) && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{isEdit ? "Update" : "Create"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

function IncidentDetail({
	projectId,
	incidentId,
	open,
	onOpenChange,
}: {
	projectId: string
	incidentId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const { data: incident, isLoading } = useIncident(projectId, incidentId)
	const addUpdate = useAddIncidentUpdate()

	const form = useForm<UpdateFormData>({
		resolver: zodResolver(updateFormSchema),
		defaultValues: {
			status: "MONITORING",
			message: "",
		},
	})

	async function onSubmit(data: UpdateFormData) {
		try {
			await addUpdate.mutateAsync({ projectId, incidentId, data })
			toast.success("Update added")
			form.reset()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to add update")
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Incident Details</DialogTitle>
				</DialogHeader>
				{isLoading ? (
					<Skeleton className="h-48" />
				) : incident ? (
					<div className="space-y-6">
						<div>
							<h3 className="font-semibold text-lg">{incident.title}</h3>
							<div className="flex gap-2 mt-2">
								<Badge variant={getStatusBadgeVariant(incident.status)}>
									{incident.status}
								</Badge>
								<Badge className={IMPACT_COLORS[incident.impact]}>
									{incident.impact}
								</Badge>
								{incident.autoCreated && (
									<Badge variant="outline">Auto-created</Badge>
								)}
							</div>
						</div>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Timeline</CardTitle>
							</CardHeader>
							<CardContent>
								{incident.updates.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No updates yet
									</p>
								) : (
									<div className="space-y-4">
										{incident.updates.map((update) => (
											<div key={update.id} className="border-l-2 pl-4 pb-4">
												<div className="flex items-center gap-2">
													<Badge
														variant={getStatusBadgeVariant(update.status)}
														className="text-xs"
													>
														{update.status}
													</Badge>
													<span className="text-xs text-muted-foreground">
														{formatDistanceToNow(new Date(update.createdAt), {
															addSuffix: true,
														})}
													</span>
												</div>
												<p className="mt-1 text-sm">{update.message}</p>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Add Update</CardTitle>
							</CardHeader>
							<CardContent>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="space-y-4"
									>
										<FormField
											control={form.control}
											name="status"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Status</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="INVESTIGATING">
																Investigating
															</SelectItem>
															<SelectItem value="IDENTIFIED">
																Identified
															</SelectItem>
															<SelectItem value="MONITORING">
																Monitoring
															</SelectItem>
															<SelectItem value="RESOLVED">Resolved</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="message"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Message</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Describe the current status..."
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button type="submit" disabled={addUpdate.isPending}>
											{addUpdate.isPending && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Add Update
										</Button>
									</form>
								</Form>
							</CardContent>
						</Card>
					</div>
				) : (
					<p className="text-muted-foreground">Incident not found</p>
				)}
			</DialogContent>
		</Dialog>
	)
}

export function IncidentsTab({ projectId }: IncidentsTabProps) {
	const [formOpen, setFormOpen] = useState(false)
	const [editIncident, setEditIncident] = useState<Incident | null>(null)
	const [detailId, setDetailId] = useState<string | null>(null)
	const [deleteId, setDeleteId] = useState<string | null>(null)

	const { data, isLoading } = useIncidents(projectId)
	const deleteIncident = useDeleteIncident()

	async function handleDelete() {
		if (!deleteId) return
		try {
			await deleteIncident.mutateAsync({ projectId, incidentId: deleteId })
			toast.success("Incident deleted")
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete incident",
			)
		} finally {
			setDeleteId(null)
		}
	}

	if (isLoading) {
		return <Skeleton className="h-64" />
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<p className="text-sm text-muted-foreground">
					{data?.total ?? 0} incident(s)
				</p>
				<Button onClick={() => setFormOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					New Incident
				</Button>
			</div>

			{!data?.incidents.length ? (
				<Card>
					<CardContent className="py-12 text-center">
						<AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
						<p className="mt-4 text-muted-foreground">No incidents</p>
						<p className="text-sm text-muted-foreground">
							Create one to track issues on your status page
						</p>
					</CardContent>
				</Card>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Impact</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.incidents.map((incident) => (
							<TableRow
								key={incident.id}
								className="cursor-pointer"
								onClick={() => setDetailId(incident.id)}
							>
								<TableCell className="font-medium">{incident.title}</TableCell>
								<TableCell>
									<Badge variant={getStatusBadgeVariant(incident.status)}>
										{incident.status}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge className={IMPACT_COLORS[incident.impact]}>
										{incident.impact}
									</Badge>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{formatDistanceToNow(new Date(incident.createdAt), {
										addSuffix: true,
									})}
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="icon"
										onClick={(e) => {
											e.stopPropagation()
											setDeleteId(incident.id)
										}}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<IncidentForm
				projectId={projectId}
				incident={editIncident}
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open)
					if (!open) setEditIncident(null)
				}}
			/>

			{detailId && (
				<IncidentDetail
					projectId={projectId}
					incidentId={detailId}
					open={!!detailId}
					onOpenChange={(open) => !open && setDetailId(null)}
				/>
			)}

			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Incident</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure? This will permanently delete this incident and all
							its updates.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteIncident.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
