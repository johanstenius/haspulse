"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getCurrentOrgId } from "@/lib/api"
import { useSession } from "@/lib/auth-client"
import { useOrganization, useUpdateOrganization } from "@/lib/query"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
	const { data: session, isPending } = useSession()
	const [orgId, setOrgId] = useState<string | null>(null)

	useEffect(() => {
		setOrgId(getCurrentOrgId())
	}, [])

	const { data: org, isLoading: orgLoading } = useOrganization(orgId ?? "")
	const updateOrg = useUpdateOrganization()

	async function handleAutoCreateToggle(checked: boolean) {
		if (!orgId) return
		try {
			await updateOrg.mutateAsync({
				id: orgId,
				data: { autoCreateIncidents: checked },
			})
			toast.success("Settings updated")
		} catch {
			toast.error("Failed to update settings")
		}
	}

	if (isPending || orgLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		)
	}

	return (
		<div className="p-6 max-w-2xl space-y-6">
			<div className="mb-6">
				<h1 className="font-display text-2xl font-semibold">Settings</h1>
				<p className="text-muted-foreground">Manage your account settings</p>
			</div>

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

			{org && (
				<Card>
					<CardHeader>
						<CardTitle>Organization</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="auto-incidents">Auto-create incidents</Label>
								<p className="text-xs text-muted-foreground">
									Automatically create incidents when checks go down
								</p>
							</div>
							<Switch
								id="auto-incidents"
								checked={org.autoCreateIncidents}
								onCheckedChange={handleAutoCreateToggle}
								disabled={updateOrg.isPending}
							/>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
