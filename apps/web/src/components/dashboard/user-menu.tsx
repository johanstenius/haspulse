"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut, useSession } from "@/lib/auth-client"
import { LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function UserMenu() {
	const { data: session } = useSession()
	const router = useRouter()

	async function handleSignOut() {
		await signOut()
		router.push("/login")
	}

	if (!session?.user) return null

	const initials = session.user.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors">
				<Avatar className="h-8 w-8">
					<AvatarImage src={session.user.image ?? undefined} />
					<AvatarFallback className="text-xs">
						{initials ?? <User className="h-4 w-4" />}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 text-left truncate">
					<p className="font-medium truncate">
						{session.user.name ?? session.user.email}
					</p>
					{session.user.name && (
						<p className="text-xs text-muted-foreground truncate">
							{session.user.email}
						</p>
					)}
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuItem asChild>
					<Link href="/settings" className="flex items-center">
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleSignOut}
					className="text-destructive focus:text-destructive"
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
