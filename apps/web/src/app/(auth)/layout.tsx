import { Logo } from "@/components/logo"
import Link from "next/link"

export default function AuthLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			{/* Left side - Branded panel */}
			<div className="hidden lg:flex flex-col justify-between bg-card border-r border-border p-10 relative overflow-hidden">
				{/* Subtle glow effect */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

				<Logo size="md" />

				<div className="space-y-4 relative">
					<blockquote className="text-lg font-medium leading-relaxed text-foreground">
						&ldquo;Finally, a cron monitoring service that doesn&apos;t require
						a PhD to set up. Added it to our backup script in 30 seconds.&rdquo;
					</blockquote>
					<p className="text-sm text-muted-foreground">— A happy developer</p>
				</div>

				<p className="text-sm text-muted-foreground">
					© 2025 Haspulse. All rights reserved.
				</p>
			</div>

			{/* Right side - Form */}
			<div className="flex flex-col bg-background">
				<div className="p-6 lg:hidden">
					<Logo />
				</div>

				<div className="flex-1 flex items-center justify-center p-6">
					<div className="w-full max-w-sm">{children}</div>
				</div>

				<div className="p-6 text-center text-sm text-muted-foreground lg:hidden">
					<Link href="/" className="hover:text-foreground transition-colors">
						← Back to home
					</Link>
				</div>
			</div>
		</div>
	)
}
