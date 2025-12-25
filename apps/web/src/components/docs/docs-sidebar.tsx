"use client"

import { docsNav } from "@/data/docs-nav"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function DocsSidebar() {
	const pathname = usePathname()

	return (
		<nav className="docs-sidebar hidden lg:block">
			<div className="sticky top-24 -ml-2">
				{docsNav.map((section) => (
					<div key={section.title} className="docs-sidebar-section">
						<h4 className="docs-sidebar-title">{section.title}</h4>
						<ul className="space-y-0.5">
							{section.items.map((item) => {
								const isActive =
									pathname === item.href ||
									(item.href !== "/docs" &&
										pathname.startsWith(item.href.split("#")[0]))

								return (
									<li key={item.href}>
										<Link
											href={item.href}
											className={cn("docs-sidebar-link", isActive && "active")}
										>
											{item.title}
										</Link>
									</li>
								)
							})}
						</ul>
					</div>
				))}
			</div>
		</nav>
	)
}
