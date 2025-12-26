"use client"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { Check, Copy, Loader2, Terminal } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type PingTesterProps = {
	checkId: string
	slug: string
	apiKey: string
	onSuccess: () => void
	onSkip: () => void
}

export function PingTester({
	checkId,
	slug,
	apiKey,
	onSuccess,
	onSkip,
}: PingTesterProps) {
	const [pingReceived, setPingReceived] = useState(false)
	const [copied, setCopied] = useState(false)
	const initialLastPingAt = useRef<string | null>(null)
	const hasCalledSuccess = useRef(false)

	const { data: check } = useQuery({
		queryKey: ["check", checkId, "poll"],
		queryFn: () => api.checks.get(checkId),
		refetchInterval: pingReceived ? false : 2000,
		enabled: !!checkId && !pingReceived,
	})

	useEffect(() => {
		if (!check) return

		// Store initial lastPingAt on first load
		if (initialLastPingAt.current === null) {
			initialLastPingAt.current = check.lastPingAt ?? "never"
		}

		// Check if lastPingAt changed (new ping received)
		if (
			check.lastPingAt &&
			check.lastPingAt !== initialLastPingAt.current &&
			initialLastPingAt.current !== "never"
		) {
			setPingReceived(true)
		}

		// Also check if status changed to UP (for first ping)
		if (check.status === "UP" && !pingReceived) {
			setPingReceived(true)
		}
	}, [check, pingReceived])

	useEffect(() => {
		if (pingReceived && !hasCalledSuccess.current) {
			hasCalledSuccess.current = true
			const timer = setTimeout(() => {
				onSuccess()
			}, 1500)
			return () => clearTimeout(timer)
		}
	}, [pingReceived, onSuccess])

	const curlCommand = `curl -H "Authorization: Bearer ${apiKey}" https://api.haspulse.dev/ping/${slug}`

	async function copyToClipboard() {
		await navigator.clipboard.writeText(curlCommand)
		setCopied(true)
		toast.success("Copied to clipboard")
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<p className="text-sm font-medium text-muted-foreground">
					Run this command in your terminal
				</p>
				<div className="flex items-center gap-2">
					<div className="flex-1 flex items-center gap-3 rounded-lg bg-zinc-950 border border-border px-4 py-3 font-mono text-xs">
						<Terminal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
						<code className="text-foreground break-all">{curlCommand}</code>
					</div>
					<Button
						variant="outline"
						size="icon"
						onClick={copyToClipboard}
						className="flex-shrink-0"
					>
						{copied ? (
							<Check className="h-4 w-4 text-primary" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			<div className="rounded-lg border border-border bg-card p-6">
				<div className="flex flex-col items-center justify-center text-center space-y-4">
					{pingReceived ? (
						<>
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
								<Check className="h-8 w-8 text-primary" />
							</div>
							<div>
								<p className="font-semibold text-foreground">Ping received!</p>
								<p className="text-sm text-muted-foreground">
									Your check is now monitoring
								</p>
							</div>
						</>
					) : (
						<>
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
								<Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
							</div>
							<div>
								<p className="font-semibold text-foreground">
									Waiting for ping...
								</p>
								<p className="text-sm text-muted-foreground">
									Run the command above to test your check
								</p>
							</div>
						</>
					)}
				</div>
			</div>

			{!pingReceived && (
				<div className="flex justify-center">
					<Button variant="ghost" onClick={onSkip}>
						Skip for now
					</Button>
				</div>
			)}
		</div>
	)
}
