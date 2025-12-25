"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Check, Project } from "@/lib/api"
import { cn } from "@/lib/utils"
import { FolderKanban } from "lucide-react"
import Link from "next/link"

type ProjectCardProps = {
	project: Project
	checks?: Check[]
}

export function ProjectCard({ project, checks = [] }: ProjectCardProps) {
	const upCount = checks.filter((c) => c.status === "UP").length
	const downCount = checks.filter(
		(c) => c.status === "DOWN" || c.status === "LATE",
	).length
	const totalCount = checks.length

	const hasIssues = downCount > 0
	const allGood = totalCount > 0 && upCount === totalCount

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
							{upCount > 0 && (
								<span className="text-success">{upCount} up</span>
							)}
							{downCount > 0 && (
								<span className="text-destructive">{downCount} down</span>
							)}
							{totalCount - upCount - downCount > 0 && (
								<span className="text-muted-foreground">
									{totalCount - upCount - downCount} other
								</span>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}
