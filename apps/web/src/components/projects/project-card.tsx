"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CheckStatus, Project } from "@/lib/api"
import { cn } from "@/lib/utils"
import { FolderKanban } from "lucide-react"
import Link from "next/link"

type CheckWithStatus = {
	status: CheckStatus
}

type ProjectCardProps = {
	project: Project
	checks?: CheckWithStatus[]
}

export function ProjectCard({ project, checks = [] }: ProjectCardProps) {
	const counts = {
		up: checks.filter((c) => c.status === "UP").length,
		down: checks.filter((c) => c.status === "DOWN" || c.status === "LATE")
			.length,
		new: checks.filter((c) => c.status === "NEW").length,
		paused: checks.filter((c) => c.status === "PAUSED").length,
	}
	const totalCount = checks.length

	const hasIssues = counts.down > 0
	const allGood = totalCount > 0 && counts.up === totalCount

	return (
		<Link href={`/projects/${project.id}`}>
			<Card className="hover:border-foreground/20 transition-colors cursor-pointer">
				<CardHeader className="flex flex-row items-center gap-3 pb-2">
					<div
						className={cn(
							"w-10 h-10 rounded-lg flex items-center justify-center",
							hasIssues
								? "bg-destructive/10"
								: allGood
									? "bg-success/10"
									: "bg-muted",
						)}
					>
						<FolderKanban
							className={cn(
								"h-5 w-5",
								hasIssues
									? "text-destructive"
									: allGood
										? "text-success"
										: "text-muted-foreground",
							)}
						/>
					</div>
					<div className="flex-1 min-w-0">
						<CardTitle className="text-base truncate">{project.name}</CardTitle>
						<p className="text-xs text-muted-foreground font-mono truncate">
							/{project.slug}
						</p>
					</div>
				</CardHeader>
				<CardContent>
					{totalCount === 0 ? (
						<p className="text-sm text-muted-foreground">No checks yet</p>
					) : (
						<div className="flex items-center gap-4 text-sm">
							{counts.up > 0 && (
								<span className="text-primary">{counts.up} up</span>
							)}
							{counts.down > 0 && (
								<span className="text-destructive">{counts.down} down</span>
							)}
							{counts.new > 0 && (
								<span className="text-chart-2">{counts.new} new</span>
							)}
							{counts.paused > 0 && (
								<span className="text-muted-foreground">
									{counts.paused} paused
								</span>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}
