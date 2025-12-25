"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"

type CopyButtonProps = {
	text: string
	className?: string
}

export function CopyButton({ text, className = "" }: CopyButtonProps) {
	const [copied, setCopied] = useState(false)

	async function handleCopy() {
		await navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<button
			type="button"
			className={`inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}
			onClick={handleCopy}
		>
			{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
			{copied ? "Copied" : "Copy"}
		</button>
	)
}
