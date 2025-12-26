"use client"

import { ApiKeysTab } from "@/components/projects/api-keys-tab"
import { ChannelsTab } from "@/components/projects/channels-tab"
import { ChecksTab } from "@/components/projects/checks-tab"
import { IncidentsTab } from "@/components/projects/incidents-tab"
import { MaintenanceTab } from "@/components/projects/maintenance-tab"
import { SettingsTab } from "@/components/projects/settings-tab"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProject } from "@/lib/query"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export default function ProjectDetailPage({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = use(params)
	const { data: project, isLoading } = useProject(id)

	if (isLoading) {
		return (
			<div className="p-6">
				<Skeleton className="h-8 w-48 mb-4" />
				<Skeleton className="h-64" />
			</div>
		)
	}

	if (!project) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">Project not found</p>
				<Button asChild className="mt-4">
					<Link href="/projects">Back to projects</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="p-6">
			<div className="flex items-center gap-4 mb-6">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/projects">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-display text-2xl font-semibold">{project.name}</h1>
					<p className="text-muted-foreground font-mono text-sm">
						/{project.slug}
					</p>
				</div>
			</div>

			<Tabs defaultValue="checks">
				<TabsList>
					<TabsTrigger value="checks">Checks</TabsTrigger>
					<TabsTrigger value="incidents">Incidents</TabsTrigger>
					<TabsTrigger value="maintenance">Maintenance</TabsTrigger>
					<TabsTrigger value="channels">Channels</TabsTrigger>
					<TabsTrigger value="api-keys">API Keys</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="checks" className="mt-6">
					<ChecksTab projectId={id} />
				</TabsContent>

				<TabsContent value="incidents" className="mt-6">
					<IncidentsTab projectId={id} />
				</TabsContent>

				<TabsContent value="maintenance" className="mt-6">
					<MaintenanceTab projectId={id} />
				</TabsContent>

				<TabsContent value="channels" className="mt-6">
					<ChannelsTab projectId={id} />
				</TabsContent>

				<TabsContent value="api-keys" className="mt-6">
					<ApiKeysTab projectId={id} />
				</TabsContent>

				<TabsContent value="settings" className="mt-6">
					<SettingsTab project={project} />
				</TabsContent>
			</Tabs>
		</div>
	)
}
