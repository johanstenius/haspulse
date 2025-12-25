import { cn } from "@/lib/utils"
import Link from "next/link"

type LogoProps = {
	className?: string
	size?: "sm" | "md" | "lg"
	showText?: boolean
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
	const sizes = {
		sm: "h-7 w-7",
		md: "h-9 w-9",
		lg: "h-12 w-12",
	}

	const textSizes = {
		sm: "text-base",
		md: "text-lg",
		lg: "text-2xl",
	}

	return (
		<Link href="/" className={cn("flex items-center gap-2.5", className)}>
			<div
				className={cn(
					"rounded-lg bg-primary flex items-center justify-center",
					sizes[size],
				)}
			>
				<svg
					className={cn(
						"text-primary-foreground",
						size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-7 h-7",
					)}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M3 12h4l3-9 4 18 3-9h4" />
				</svg>
			</div>
			{showText && (
				<span className={cn("font-semibold text-foreground", textSizes[size])}>
					Haspulse
				</span>
			)}
		</Link>
	)
}
