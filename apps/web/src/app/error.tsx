"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"

type ErrorProps = {
	error: Error & { digest?: string }
	reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
	useEffect(() => {
		console.error("Global error:", error)
	}, [error])

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="text-center max-w-md">
				<div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
					<AlertTriangle className="h-6 w-6 text-destructive" />
				</div>
				<h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
				<p className="text-muted-foreground mb-6">
					An unexpected error occurred. Please try again.
				</p>
				<div className="flex gap-3 justify-center">
					<Button
						variant="outline"
						onClick={() => {
							window.location.href = "/"
						}}
					>
						Go home
					</Button>
					<Button onClick={reset}>Try again</Button>
				</div>
			</div>
		</div>
	)
}
