"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useOrg } from "@/lib/org-context"
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react"
import Link from "next/link"

export function OrgSwitcher() {
	const { organizations, currentOrg, isLoading, switchOrg } = useOrg()

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
				<Building2 className="h-4 w-4" />
				<span>Loading...</span>
			</div>
		)
	}

	if (!currentOrg) {
		return (
			<Link href="/onboarding">
				<Button
					variant="outline"
					size="sm"
					className="w-full justify-start gap-2"
				>
					<Plus className="h-4 w-4" />
					Create organization
				</Button>
			</Link>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="w-full justify-between px-2 py-1.5 h-auto font-normal"
				>
					<div className="flex items-center gap-2 truncate">
						<Building2 className="h-4 w-4 shrink-0" />
						<span className="truncate">{currentOrg.name}</span>
					</div>
					<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				<DropdownMenuLabel>Organizations</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{organizations.map((org) => (
					<DropdownMenuItem
						key={org.id}
						onClick={() => switchOrg(org.id)}
						className="flex items-center justify-between"
					>
						<span className="truncate">{org.name}</span>
						{org.id === currentOrg.id && <Check className="h-4 w-4 shrink-0" />}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link
						href="/settings/organizations/new"
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						Create organization
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
