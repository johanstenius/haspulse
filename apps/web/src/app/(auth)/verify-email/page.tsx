"use client"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { Mail } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

function VerifyEmailContent() {
	const searchParams = useSearchParams()
	const email = searchParams.get("email")
	const [resending, setResending] = useState(false)
	const [resent, setResent] = useState(false)

	async function handleResend() {
		if (!email) return
		setResending(true)
		try {
			await authClient.sendVerificationEmail({ email })
			setResent(true)
		} finally {
			setResending(false)
		}
	}

	return (
		<div className="space-y-6 text-center">
			<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
				<Mail className="w-6 h-6 text-primary" />
			</div>

			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					Check your email
				</h1>
				<p className="text-sm text-muted-foreground">
					We sent a verification link to{" "}
					<span className="font-medium text-foreground">{email}</span>
				</p>
			</div>

			<div className="space-y-3">
				<p className="text-sm text-muted-foreground">
					Click the link in the email to verify your account and get started.
				</p>

				{resent ? (
					<p className="text-sm text-primary">Verification email sent!</p>
				) : (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleResend}
						disabled={resending || !email}
					>
						{resending ? "Sending..." : "Resend verification email"}
					</Button>
				)}
			</div>

			<p className="text-center text-sm text-muted-foreground">
				Wrong email?{" "}
				<Link
					href="/register"
					className="font-medium text-foreground hover:underline"
				>
					Try again
				</Link>
			</p>
		</div>
	)
}

export default function VerifyEmailPage() {
	return (
		<Suspense
			fallback={
				<div className="space-y-6 text-center">
					<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
						<Mail className="w-6 h-6 text-primary" />
					</div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Check your email
					</h1>
				</div>
			}
		>
			<VerifyEmailContent />
		</Suspense>
	)
}
