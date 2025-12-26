"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
	const { data: session, isPending } = useSession()

	if (isPending) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		)
	}

	return (
		<div className="p-6 max-w-2xl space-y-6">
			<PageHeader title="Settings" description="Manage your account settings" />

			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input id="name" value={session?.user?.name ?? ""} disabled />
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={session?.user?.email ?? ""}
							disabled
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						Profile changes coming soon.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
