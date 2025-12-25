import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="max-w-6xl mx-auto px-6 py-16">
				<div className="flex gap-16">
					<DocsSidebar />
					<main className="flex-1 min-w-0 max-w-3xl">{children}</main>
				</div>
			</div>
			<Footer />
		</div>
	)
}
