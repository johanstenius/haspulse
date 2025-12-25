"use client"

import { authClient } from "@/lib/auth-client"
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

type Status = "loading" | "success" | "error"

function VerifyCallbackContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const token = searchParams.get("token")
	const [status, setStatus] = useState<Status>("loading")
	const [error, setError] = useState<string>("")

	useEffect(() => {
		if (!token) {
			setStatus("error")
			setError("Missing verification token")
			return
		}

		authClient
			.verifyEmail({ query: { token } })
			.then((res) => {
				if (res.error) {
					setStatus("error")
					setError(res.error.message ?? "Verification failed")
				} else {
					setStatus("success")
					setTimeout(() => router.push("/dashboard"), 1500)
				}
			})
			.catch(() => {
				setStatus("error")
				setError("Verification failed")
			})
	}, [token, router])

	if (status === "loading") {
		return (
			<div className="space-y-6 text-center">
				<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
					<Loader2 className="w-6 h-6 text-primary animate-spin" />
				</div>
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Verifying email...
					</h1>
					<p className="text-sm text-muted-foreground">Please wait</p>
				</div>
			</div>
		)
	}

	if (status === "error") {
		return (
			<div className="space-y-6 text-center">
				<div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
					<XCircle className="w-6 h-6 text-destructive" />
				</div>
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Verification failed
					</h1>
					<p className="text-sm text-muted-foreground">{error}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6 text-center">
			<div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
				<CheckCircle className="w-6 h-6 text-green-500" />
			</div>
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					Email verified!
				</h1>
				<p className="text-sm text-muted-foreground">
					Redirecting to dashboard...
				</p>
			</div>
		</div>
	)
}

export default function VerifyCallbackPage() {
	return (
		<Suspense
			fallback={
				<div className="space-y-6 text-center">
					<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
						<Loader2 className="w-6 h-6 text-primary animate-spin" />
					</div>
					<h1 className="text-2xl font-semibold tracking-tight">Loading...</h1>
				</div>
			}
		>
			<VerifyCallbackContent />
		</Suspense>
	)
}
