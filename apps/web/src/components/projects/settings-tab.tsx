"use client"

import { ProjectForm } from "@/components/projects/project-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Project } from "@/lib/api"
import { useDeleteProject, useUpdateProject } from "@/lib/query"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type SettingsTabProps = {
	project: Project
}

export function SettingsTab({ project }: SettingsTabProps) {
	const router = useRouter()
	const updateProject = useUpdateProject()
	const deleteProject = useDeleteProject()

	const [showForm, setShowForm] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	function handleUpdate(data: {
		name: string
		slug: string
		timezone?: string
	}) {
		updateProject.mutate(
			{ id: project.id, data },
			{
				onSuccess: () => {
					setShowForm(false)
					toast.success("Project updated")
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	function handleToggleStatusPage(enabled: boolean) {
		updateProject.mutate(
			{ id: project.id, data: { statusPageEnabled: enabled } },
			{
				onSuccess: () =>
					toast.success(
						enabled ? "Status page enabled" : "Status page disabled",
					),
				onError: (error) => toast.error(error.message),
			},
		)
	}

	function handleDelete() {
		deleteProject.mutate(project.id, {
			onSuccess: () => {
				router.push("/projects")
				toast.success("Project deleted")
			},
			onError: (error) => toast.error(error.message),
		})
	}

	return (
		<>
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Project Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-muted-foreground">Name</p>
								<p className="font-medium">{project.name}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Slug</p>
								<p className="font-mono">{project.slug}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Timezone</p>
								<p>{project.timezone}</p>
							</div>
						</div>
						<Button variant="outline" onClick={() => setShowForm(true)}>
							Edit project
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Status Page</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Enable public status page</Label>
								<p className="text-sm text-muted-foreground">
									haspulse.dev/status/{project.slug}
								</p>
							</div>
							<Switch
								checked={project.statusPageEnabled}
								onCheckedChange={handleToggleStatusPage}
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle className="text-destructive">Danger Zone</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							Permanently delete this project and all its data.
						</p>
						<Button
							variant="destructive"
							onClick={() => setShowDeleteConfirm(true)}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete project
						</Button>
					</CardContent>
				</Card>
			</div>

			<ProjectForm
				open={showForm}
				onOpenChange={setShowForm}
				onSubmit={handleUpdate}
				project={project}
				isLoading={updateProject.isPending}
			/>

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				title="Delete project"
				description={`Are you sure you want to delete "${project.name}"? This will delete all checks, channels, and API keys. This cannot be undone.`}
				confirmLabel="Delete"
				variant="destructive"
				onConfirm={handleDelete}
			/>
		</>
	)
}
