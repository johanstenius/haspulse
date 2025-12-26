"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	formatCronTime,
	getRelativeTime,
	parseCronExpression,
} from "@/lib/cron"
import { Check, Clock, Copy } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type QuickPattern = {
	label: string
	expression: string
}

const quickPatterns: QuickPattern[] = [
	{ label: "Every minute", expression: "* * * * *" },
	{ label: "Every 5 minutes", expression: "*/5 * * * *" },
	{ label: "Every hour", expression: "0 * * * *" },
	{ label: "Daily at midnight", expression: "0 0 * * *" },
	{ label: "Daily at 3 AM", expression: "0 3 * * *" },
	{ label: "Weekly on Monday", expression: "0 0 * * 1" },
	{ label: "Monthly on 1st", expression: "0 0 1 * *" },
]

type CronCalculatorProps = {
	initialExpression?: string
}

export function CronCalculator({
	initialExpression = "*/5 * * * *",
}: CronCalculatorProps) {
	const [expression, setExpression] = useState(initialExpression)
	const [copied, setCopied] = useState(false)

	const parsed = parseCronExpression(expression, 10)

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(expression)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [expression])

	const handleCopyCurl = useCallback(async () => {
		const curl = "curl -fsS --retry 3 https://haspulse.dev/ping/YOUR_CHECK_ID"
		await navigator.clipboard.writeText(curl)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [])

	useEffect(() => {
		setExpression(initialExpression)
	}, [initialExpression])

	return (
		<div className="space-y-6">
			{/* Expression Input */}
			<div className="space-y-2">
				<label
					htmlFor="cron-input"
					className="text-sm font-medium text-muted-foreground"
				>
					Cron Expression
				</label>
				<div className="flex gap-2">
					<Input
						id="cron-input"
						value={expression}
						onChange={(e) => setExpression(e.target.value)}
						placeholder="* * * * *"
						className="font-mono text-lg"
					/>
					<Button variant="outline" size="icon" onClick={handleCopy}>
						{copied ? (
							<Check className="h-4 w-4" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Quick Patterns */}
			<div className="space-y-2">
				<span className="text-sm font-medium text-muted-foreground block">
					Quick patterns
				</span>
				<div className="flex flex-wrap gap-2">
					{quickPatterns.map((pattern) => (
						<Button
							key={pattern.expression}
							variant={
								expression === pattern.expression ? "default" : "outline"
							}
							size="sm"
							onClick={() => setExpression(pattern.expression)}
						>
							{pattern.label}
						</Button>
					))}
				</div>
			</div>

			{/* Result */}
			{parsed.isValid ? (
				<div className="space-y-6">
					{/* Human Readable */}
					<div className="bg-card border border-border rounded-lg p-4">
						<div className="text-sm text-muted-foreground mb-1">Schedule</div>
						<div className="text-xl font-medium text-primary">
							{parsed.humanReadable}
						</div>
					</div>

					{/* Field Breakdown */}
					{parsed.fields && (
						<div className="space-y-2">
							<span className="text-sm font-medium text-muted-foreground block">
								Expression breakdown
							</span>
							<div className="grid grid-cols-5 gap-2">
								{parsed.fields.map((field) => (
									<div
										key={field.name}
										className="bg-card border border-border rounded-lg p-3 text-center"
									>
										<div className="font-mono text-lg text-foreground">
											{field.value}
										</div>
										<div className="text-xs text-muted-foreground capitalize">
											{field.name}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Next Runs */}
					{parsed.nextRuns && parsed.nextRuns.length > 0 && (
						<div className="space-y-2">
							<span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Clock className="h-4 w-4" />
								Next 10 runs
							</span>
							<div className="bg-card border border-border rounded-lg divide-y divide-border">
								{parsed.nextRuns.map((date) => (
									<div
										key={date.toISOString()}
										className="flex justify-between items-center px-4 py-2 text-sm"
									>
										<span className="text-foreground font-mono">
											{formatCronTime(date)}
										</span>
										<span className="text-muted-foreground">
											{getRelativeTime(date)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* curl command */}
					<div className="space-y-2">
						<span className="text-sm font-medium text-muted-foreground block">
							Monitor with HasPulse
						</span>
						<div className="bg-card border border-border rounded-lg p-4">
							<div className="flex items-center justify-between gap-4">
								<code className="text-sm font-mono text-foreground break-all">
									curl -fsS --retry 3 https://haspulse.dev/ping/YOUR_CHECK_ID
								</code>
								<Button variant="outline" size="sm" onClick={handleCopyCurl}>
									<Copy className="h-3 w-3 mr-1" />
									Copy
								</Button>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
					<div className="text-destructive font-medium">Invalid expression</div>
					<div className="text-sm text-destructive/80 mt-1">{parsed.error}</div>
				</div>
			)}
		</div>
	)
}
