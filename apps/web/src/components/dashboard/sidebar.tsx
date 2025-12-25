"use client"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
	CreditCard,
	FolderKanban,
	LayoutDashboard,
	Menu,
	Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { OrgSwitcher } from "./org-switcher"
import { UserMenu } from "./user-menu"

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/projects", label: "Projects", icon: FolderKanban },
	{ href: "/settings/billing", label: "Billing", icon: CreditCard },
	{ href: "/settings", label: "Settings", icon: Settings },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
	const pathname = usePathname()

	return (
		<>
			<div className="p-4 border-b border-border">
				<Logo size="sm" />
			</div>

			<div className="p-3 border-b border-border">
				<OrgSwitcher />
			</div>

			<nav className="flex-1 p-3 space-y-1">
				{navItems.map((item) => {
					const isActive =
						pathname === item.href || pathname.startsWith(`${item.href}/`)
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onNavClick}
							className={cn(
								"flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
								isActive
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground hover:bg-secondary",
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Link>
					)
				})}
			</nav>

			<div className="p-3 border-t border-border">
				<UserMenu />
			</div>
		</>
	)
}

export function Sidebar() {
	return (
		<aside className="hidden lg:flex flex-col h-full w-64 border-r border-border bg-card">
			<SidebarContent />
		</aside>
	)
}

export function MobileNav() {
	const [open, setOpen] = useState(false)

	return (
		<div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
			<Logo size="sm" />
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild>
					<Button variant="ghost" size="icon">
						<Menu className="h-5 w-5" />
						<span className="sr-only">Toggle menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="p-0 w-64">
					<SheetHeader className="sr-only">
						<SheetTitle>Navigation</SheetTitle>
					</SheetHeader>
					<div className="flex flex-col h-full">
						<SidebarContent onNavClick={() => setOpen(false)} />
					</div>
				</SheetContent>
			</Sheet>
		</div>
	)
}
