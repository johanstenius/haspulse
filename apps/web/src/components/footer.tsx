import Link from "next/link"
import { Logo } from "./logo"

export function Footer() {
	return (
		<footer className="border-t border-border py-8">
			<div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Logo size="sm" showText={false} />
					<span className="text-sm text-muted-foreground">© 2025 Haspulse</span>
				</div>
				<div className="flex items-center gap-6 text-sm text-muted-foreground">
					<Link href="#" className="hover:text-foreground transition-colors">
						Privacy
					</Link>
					<Link href="#" className="hover:text-foreground transition-colors">
						Terms
					</Link>
					<Link href="#" className="hover:text-foreground transition-colors">
						Contact
					</Link>
				</div>
			</div>
		</footer>
	)
}
