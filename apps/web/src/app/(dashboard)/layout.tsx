import { MobileNav, Sidebar } from "@/components/dashboard/sidebar"
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider"
import { OrgProvider } from "@/lib/org-context"
import type { ReactNode } from "react"

type DashboardLayoutProps = {
	children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<OrgProvider>
			<KeyboardShortcutsProvider>
				<div className="flex h-screen flex-col lg:flex-row">
					<MobileNav />
					<Sidebar />
					<main className="flex-1 overflow-auto">{children}</main>
				</div>
			</KeyboardShortcutsProvider>
		</OrgProvider>
	)
}
