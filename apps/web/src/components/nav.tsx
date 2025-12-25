import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "./logo"

export function Nav() {
	return (
		<nav className="border-b border-border">
			<div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
				<Logo />
				<div className="flex items-center gap-6">
					<Link
						href="#features"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Features
					</Link>
					<Link
						href="#pricing"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Pricing
					</Link>
					<Link
						href="/docs"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Docs
					</Link>
					<Button asChild>
						<Link href="/register">Get Started</Link>
					</Button>
				</div>
			</div>
		</nav>
	)
}
