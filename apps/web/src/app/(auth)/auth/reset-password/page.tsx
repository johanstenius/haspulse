"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

type Status = "idle" | "loading" | "success" | "error"

function ResetPasswordContent() {
	const searchParams = useSearchParams()
	const token = searchParams.get("token")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [status, setStatus] = useState<Status>("idle")
	const [error, setError] = useState<string>("")

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!token) {
			setError("Missing reset token")
			setStatus("error")
			return
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match")
			setStatus("error")
			return
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters")
			setStatus("error")
			return
		}

		setStatus("loading")
		try {
			const res = await authClient.resetPassword({
				newPassword: password,
				token,
			})
			if (res.error) {
				setError(res.error.message ?? "Reset failed")
				setStatus("error")
			} else {
				setStatus("success")
			}
		} catch {
			setError("Reset failed")
			setStatus("error")
		}
	}

	if (!token) {
		return (
			<div className="space-y-6 text-center">
				<div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
					<XCircle className="w-6 h-6 text-destructive" />
				</div>
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Invalid link
					</h1>
					<p className="text-sm text-muted-foreground">
						Missing reset token. Please request a new password reset.
					</p>
				</div>
			</div>
		)
	}

	if (status === "success") {
		return (
			<div className="space-y-6 text-center">
				<div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
					<CheckCircle className="w-6 h-6 text-green-500" />
				</div>
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Password reset!
					</h1>
					<p className="text-sm text-muted-foreground">
						Your password has been updated.
					</p>
				</div>
				<Button asChild className="w-full">
					<Link href="/login">Sign in</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Reset password
				</h1>
				<p className="text-sm text-muted-foreground">Enter your new password</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="password">New password</Label>
					<Input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter new password"
						required
						minLength={8}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="confirmPassword">Confirm password</Label>
					<Input
						id="confirmPassword"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Confirm new password"
						required
					/>
				</div>

				{status === "error" && (
					<p className="text-sm text-destructive">{error}</p>
				)}

				<Button
					type="submit"
					className="w-full"
					disabled={status === "loading"}
				>
					{status === "loading" ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Resetting...
						</>
					) : (
						"Reset password"
					)}
				</Button>
			</form>
		</div>
	)
}

export default function ResetPasswordPage() {
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
			<ResetPasswordContent />
		</Suspense>
	)
}
