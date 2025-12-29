"use client"

import { ApiKeysTab } from "@/components/projects/api-keys-tab"
import { ChannelsTab } from "@/components/projects/channels-tab"
import { CronJobsTab } from "@/components/projects/cron-jobs-tab"
import { HttpMonitorsTab } from "@/components/projects/http-monitors-tab"
import { SettingsTab } from "@/components/projects/settings-tab"
import { StatusPageTab } from "@/components/projects/status-page-tab"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProject } from "@/lib/query"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, use } from "react"

const VALID_TABS = [
	"cron-jobs",
	"http-monitors",
	"channels",
	"api-keys",
	"status-page",
	"settings",
] as const
type TabValue = (typeof VALID_TABS)[number]

function ProjectDetailContent({ id }: { id: string }) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const { data: project, isLoading } = useProject(id)

	const tabParam = searchParams.get("tab")
	const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue)
		? (tabParam as TabValue)
		: "cron-jobs"

	function handleTabChange(value: string) {
		const params = new URLSearchParams(searchParams.toString())
		if (value === "cron-jobs") {
			params.delete("tab")
		} else {
			params.set("tab", value)
		}
		const query = params.toString()
		router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
	}

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
					<h1 className="font-display text-2xl font-semibold">
						{project.name}
					</h1>
					<p className="text-muted-foreground font-mono text-sm">
						/{project.slug}
					</p>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={handleTabChange}>
				<TabsList>
					<TabsTrigger value="cron-jobs">Cron Jobs</TabsTrigger>
					<TabsTrigger value="http-monitors">HTTP Monitors</TabsTrigger>
					<TabsTrigger value="channels">Channels</TabsTrigger>
					<TabsTrigger value="api-keys">API Keys</TabsTrigger>
					<TabsTrigger value="status-page">Status Page</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="cron-jobs" className="mt-6">
					<CronJobsTab projectId={id} />
				</TabsContent>

				<TabsContent value="http-monitors" className="mt-6">
					<HttpMonitorsTab projectId={id} />
				</TabsContent>

				<TabsContent value="channels" className="mt-6">
					<ChannelsTab projectId={id} />
				</TabsContent>

				<TabsContent value="api-keys" className="mt-6">
					<ApiKeysTab projectId={id} />
				</TabsContent>

				<TabsContent value="status-page" className="mt-6">
					<StatusPageTab projectId={id} projectSlug={project.slug} />
				</TabsContent>

				<TabsContent value="settings" className="mt-6">
					<SettingsTab project={project} />
				</TabsContent>
			</Tabs>
		</div>
	)
}

export default function ProjectDetailPage({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = use(params)

	return (
		<Suspense
			fallback={
				<div className="p-6">
					<Skeleton className="h-8 w-48 mb-4" />
					<Skeleton className="h-64" />
				</div>
			}
		>
			<ProjectDetailContent id={id} />
		</Suspense>
	)
}
