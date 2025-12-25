"use client"

import { Button } from "@/components/ui/button"
import { api, isFetchError, setCurrentOrgId } from "@/lib/api"
import { useSession } from "@/lib/auth-client"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

type AcceptState =
	| "loading"
	| "success"
	| "error"
	| "no-token"
	| "not-logged-in"

function AcceptInviteContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const token = searchParams.get("token")
	const { data: session, isPending: sessionLoading } = useSession()

	const [state, setState] = useState<AcceptState>("loading")
	const [errorMessage, setErrorMessage] = useState("")

	useEffect(() => {
		if (sessionLoading) return

		if (!token) {
			setState("no-token")
			return
		}

		if (!session) {
			setState("not-logged-in")
			return
		}

		async function acceptInvite() {
			if (!token) return

			try {
				const result = await api.invitations.accept(token)
				setCurrentOrgId(result.orgId)
				setState("success")
				setTimeout(() => {
					router.push("/dashboard")
				}, 2000)
			} catch (err) {
				if (isFetchError(err)) {
					setErrorMessage(err.message)
				} else {
					setErrorMessage("Failed to accept invitation")
				}
				setState("error")
			}
		}

		acceptInvite()
	}, [token, session, sessionLoading, router])

	if (state === "loading" || sessionLoading) {
		return (
			<div className="flex flex-col items-center justify-center space-y-4">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-muted-foreground">Accepting invitation...</p>
			</div>
		)
	}

	if (state === "no-token") {
		return (
			<div className="flex flex-col items-center justify-center space-y-4">
				<AlertCircle className="h-12 w-12 text-destructive" />
				<h2 className="text-xl font-semibold">Invalid Invitation Link</h2>
				<p className="text-muted-foreground text-center">
					This invitation link is invalid or incomplete.
				</p>
				<Button asChild>
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		)
	}

	if (state === "not-logged-in") {
		const loginUrl = `/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`
		return (
			<div className="flex flex-col items-center justify-center space-y-4">
				<h2 className="text-xl font-semibold">Sign in to continue</h2>
				<p className="text-muted-foreground text-center">
					You need to sign in to accept this invitation.
				</p>
				<Button asChild>
					<Link href={loginUrl}>Sign In</Link>
				</Button>
				<p className="text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link
						href={`/register?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`}
						className="font-medium text-foreground hover:underline"
					>
						Sign up
					</Link>
				</p>
			</div>
		)
	}

	if (state === "error") {
		return (
			<div className="flex flex-col items-center justify-center space-y-4">
				<AlertCircle className="h-12 w-12 text-destructive" />
				<h2 className="text-xl font-semibold">Failed to Accept Invitation</h2>
				<p className="text-muted-foreground text-center">{errorMessage}</p>
				<Button asChild>
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-center space-y-4">
			<CheckCircle className="h-12 w-12 text-green-500" />
			<h2 className="text-xl font-semibold">Invitation Accepted!</h2>
			<p className="text-muted-foreground text-center">
				You&apos;ve joined the organization. Redirecting to dashboard...
			</p>
		</div>
	)
}

export default function AcceptInvitePage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-md">
				<Suspense
					fallback={
						<div className="flex flex-col items-center justify-center space-y-4">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							<p className="text-muted-foreground">Loading...</p>
						</div>
					}
				>
					<AcceptInviteContent />
				</Suspense>
			</div>
		</div>
	)
}
