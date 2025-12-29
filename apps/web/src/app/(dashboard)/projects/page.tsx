"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectForm } from "@/components/projects/project-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { isLimitExceeded } from "@/lib/api"
import {
	useBilling,
	useCreateProject,
	useDashboardCronJobs,
	useProjects,
} from "@/lib/query"
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts"
import { FolderOpen, Plus } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

export default function ProjectsPage() {
	const { data, isLoading } = useProjects()
	const { data: cronJobsData } = useDashboardCronJobs()
	const { data: billing } = useBilling()
	const createProject = useCreateProject()
	const [showForm, setShowForm] = useState(false)
	const [showUpgrade, setShowUpgrade] = useState(false)

	const projectLimit = billing?.usage.projects.limit ?? 2

	const cronJobsByProject = useMemo(() => {
		const cronJobs = cronJobsData?.cronJobs ?? []
		const map = new Map<string, typeof cronJobs>()
		for (const cronJob of cronJobs) {
			const existing = map.get(cronJob.projectId) ?? []
			map.set(cronJob.projectId, [...existing, cronJob])
		}
		return map
	}, [cronJobsData?.cronJobs])

	const openForm = useCallback(() => setShowForm(true), [])
	const shortcuts = useMemo(() => ({ n: openForm }), [openForm])
	useKeyboardShortcuts(shortcuts)

	function handleCreate(formData: {
		name: string
		slug: string
		timezone?: string
	}) {
		createProject.mutate(formData, {
			onSuccess: () => {
				setShowForm(false)
				toast.success("Project created")
			},
			onError: (error) => {
				if (isLimitExceeded(error)) {
					setShowForm(false)
					setShowUpgrade(true)
				} else {
					toast.error(error.message)
				}
			},
		})
	}

	return (
		<div className="p-6">
			<PageHeader
				title="Projects"
				description="Organize your monitors into projects"
				action={
					<Button onClick={() => setShowForm(true)}>
						<Plus className="h-4 w-4 mr-2" />
						New project
					</Button>
				}
			/>

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
			) : data?.projects.length === 0 ? (
				<EmptyState
					icon={FolderOpen}
					title="No projects yet"
					description="Projects help you organize monitors. Create your first one to get started."
					action={{
						label: "Create project",
						onClick: () => setShowForm(true),
					}}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{data?.projects.map((project) => (
						<ProjectCard
							key={project.id}
							project={project}
							cronJobs={cronJobsByProject.get(project.id)}
						/>
					))}
				</div>
			)}

			<ProjectForm
				open={showForm}
				onOpenChange={setShowForm}
				onSubmit={handleCreate}
				isLoading={createProject.isPending}
			/>

			<UpgradeDialog
				open={showUpgrade}
				onOpenChange={setShowUpgrade}
				resource="projects"
				limit={projectLimit}
			/>
		</div>
	)
}
