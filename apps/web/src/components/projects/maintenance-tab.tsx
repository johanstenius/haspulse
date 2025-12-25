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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import type { Maintenance } from "@/lib/api"
import {
	useCreateMaintenance,
	useDeleteMaintenance,
	useMaintenance,
	useUpdateMaintenance,
} from "@/lib/query"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, formatDistanceToNow } from "date-fns"
import { Loader2, Plus, Trash2, Wrench } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

type MaintenanceTabProps = {
	projectId: string
}

const maintenanceFormSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	description: z.string().max(2000).optional(),
	startsAt: z.string().min(1, "Start time is required"),
	endsAt: z.string().min(1, "End time is required"),
})

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>

function MaintenanceForm({
	projectId,
	maintenance,
	open,
	onOpenChange,
}: {
	projectId: string
	maintenance: Maintenance | null
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const createMaintenance = useCreateMaintenance()
	const updateMaintenance = useUpdateMaintenance()
	const isEdit = !!maintenance

	const form = useForm<MaintenanceFormData>({
		resolver: zodResolver(maintenanceFormSchema),
		defaultValues: {
			title: maintenance?.title ?? "",
			description: maintenance?.description ?? "",
			startsAt: maintenance?.startsAt
				? format(new Date(maintenance.startsAt), "yyyy-MM-dd'T'HH:mm")
				: "",
			endsAt: maintenance?.endsAt
				? format(new Date(maintenance.endsAt), "yyyy-MM-dd'T'HH:mm")
				: "",
		},
	})

	async function onSubmit(data: MaintenanceFormData) {
		try {
			const payload = {
				title: data.title,
				description: data.description || undefined,
				startsAt: new Date(data.startsAt).toISOString(),
				endsAt: new Date(data.endsAt).toISOString(),
			}

			if (isEdit) {
				await updateMaintenance.mutateAsync({
					projectId,
					maintenanceId: maintenance.id,
					data: payload,
				})
				toast.success("Maintenance updated")
			} else {
				await createMaintenance.mutateAsync({ projectId, data: payload })
				toast.success("Maintenance scheduled")
			}
			form.reset()
			onOpenChange(false)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to save maintenance",
			)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Maintenance" : "Schedule Maintenance"}
					</DialogTitle>
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
										<Input placeholder="Scheduled maintenance" {...field} />
									</FormControl>
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
											placeholder="Brief description of the maintenance..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="startsAt"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Start</FormLabel>
										<FormControl>
											<Input type="datetime-local" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="endsAt"
								render={({ field }) => (
									<FormItem>
										<FormLabel>End</FormLabel>
										<FormControl>
											<Input type="datetime-local" {...field} />
										</FormControl>
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
								disabled={
									createMaintenance.isPending || updateMaintenance.isPending
								}
							>
								{(createMaintenance.isPending ||
									updateMaintenance.isPending) && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{isEdit ? "Update" : "Schedule"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

function getMaintenanceStatus(startsAt: string, endsAt: string) {
	const now = new Date()
	const start = new Date(startsAt)
	const end = new Date(endsAt)

	if (now < start) return "upcoming"
	if (now > end) return "past"
	return "active"
}

export function MaintenanceTab({ projectId }: MaintenanceTabProps) {
	const [formOpen, setFormOpen] = useState(false)
	const [editMaintenance, setEditMaintenance] = useState<Maintenance | null>(
		null,
	)
	const [deleteId, setDeleteId] = useState<string | null>(null)

	const { data, isLoading } = useMaintenance(projectId)
	const deleteMaintenance = useDeleteMaintenance()

	async function handleDelete() {
		if (!deleteId) return
		try {
			await deleteMaintenance.mutateAsync({
				projectId,
				maintenanceId: deleteId,
			})
			toast.success("Maintenance deleted")
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete maintenance",
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
					{data?.total ?? 0} maintenance window(s)
				</p>
				<Button onClick={() => setFormOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Schedule Maintenance
				</Button>
			</div>

			{!data?.maintenance.length ? (
				<Card>
					<CardContent className="py-12 text-center">
						<Wrench className="mx-auto h-12 w-12 text-muted-foreground/50" />
						<p className="mt-4 text-muted-foreground">
							No scheduled maintenance
						</p>
						<p className="text-sm text-muted-foreground">
							Schedule maintenance windows to inform users
						</p>
					</CardContent>
				</Card>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Start</TableHead>
							<TableHead>End</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.maintenance.map((item) => {
							const status = getMaintenanceStatus(item.startsAt, item.endsAt)
							return (
								<TableRow
									key={item.id}
									className="cursor-pointer"
									onClick={() => {
										setEditMaintenance(item)
										setFormOpen(true)
									}}
								>
									<TableCell>
										<div>
											<p className="font-medium">{item.title}</p>
											{item.description && (
												<p className="text-sm text-muted-foreground truncate max-w-xs">
													{item.description}
												</p>
											)}
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{format(new Date(item.startsAt), "MMM d, yyyy HH:mm")}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{format(new Date(item.endsAt), "MMM d, yyyy HH:mm")}
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
												status === "active"
													? "bg-blue-100 text-blue-800"
													: status === "upcoming"
														? "bg-green-100 text-green-800"
														: "bg-gray-100 text-gray-800"
											}`}
										>
											{status}
										</span>
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => {
												e.stopPropagation()
												setDeleteId(item.id)
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			)}

			<MaintenanceForm
				projectId={projectId}
				maintenance={editMaintenance}
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open)
					if (!open) setEditMaintenance(null)
				}}
			/>

			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Maintenance</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure? This will permanently delete this maintenance
							window.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteMaintenance.isPending && (
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
