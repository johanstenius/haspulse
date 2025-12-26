import { Logo } from "./logo"

export function Footer() {
	return (
		<footer className="border-t border-border py-8">
			<div className="max-w-6xl mx-auto px-6 flex items-center justify-center">
				<div className="flex items-center gap-4">
					<Logo size="sm" showText={false} />
					<span className="text-sm text-muted-foreground">© 2025 HasPulse</span>
				</div>
			</div>
		</footer>
	)
}
