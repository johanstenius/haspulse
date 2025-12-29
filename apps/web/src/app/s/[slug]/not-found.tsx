import Link from "next/link"

export default function StatusPageNotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
			<h1 className="font-display text-4xl font-bold">404</h1>
			<p className="mt-2 text-muted-foreground">Status page not found</p>
			<Link
				href="https://haspulse.dev"
				className="mt-6 text-sm text-primary hover:underline"
			>
				Learn about HasPulse
			</Link>
		</div>
	)
}
