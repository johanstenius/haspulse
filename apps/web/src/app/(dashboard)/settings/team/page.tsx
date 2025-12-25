"use client"

import { InviteForm } from "@/components/team/invite-form"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { useSession } from "@/lib/auth-client"
import { useOrg } from "@/lib/org-context"
import {
	useCancelInvitation,
	useInvitations,
	useMembers,
	useResendInvitation,
} from "@/lib/query"
import { formatDistanceToNow } from "date-fns"
import {
	Loader2,
	MoreHorizontal,
	RefreshCw,
	Trash2,
	UserPlus,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

function getRoleBadgeVariant(
	role: string,
): "default" | "secondary" | "outline" {
	switch (role) {
		case "owner":
			return "default"
		case "admin":
			return "secondary"
		default:
			return "outline"
	}
}

export default function TeamSettingsPage() {
	const { currentOrg, isLoading: orgLoading } = useOrg()
	const { data: session } = useSession()
	const [inviteOpen, setInviteOpen] = useState(false)
	const [cancelId, setCancelId] = useState<string | null>(null)

	const { data: membersData, isLoading: membersLoading } = useMembers(
		currentOrg?.id ?? "",
	)
	const { data: invitesData, isLoading: invitesLoading } = useInvitations(
		currentOrg?.id ?? "",
	)

	const cancelInvitation = useCancelInvitation()
	const resendInvitation = useResendInvitation()

	const isLoading = orgLoading || membersLoading || invitesLoading

	async function handleCancelInvite() {
		if (!cancelId || !currentOrg) return
		try {
			await cancelInvitation.mutateAsync({
				orgId: currentOrg.id,
				inviteId: cancelId,
			})
			toast.success("Invitation cancelled")
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to cancel invite",
			)
		} finally {
			setCancelId(null)
		}
	}

	async function handleResendInvite(inviteId: string) {
		if (!currentOrg) return
		try {
			await resendInvitation.mutateAsync({
				orgId: currentOrg.id,
				inviteId,
			})
			toast.success("Invitation resent")
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to resend invite",
			)
		}
	}

	// Check if current user is owner or admin
	const currentMember = membersData?.members.find(
		(m) => m.userId === session?.user?.id,
	)
	const canManageTeam =
		currentMember?.role === "owner" || currentMember?.role === "admin"

	if (isLoading) {
		return (
			<div className="p-6 max-w-4xl">
				<div className="mb-6">
					<Skeleton className="h-8 w-32 mb-2" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-48" />
					<Skeleton className="h-32" />
				</div>
			</div>
		)
	}

	if (!currentOrg) {
		return (
			<div className="p-6 flex items-center justify-center h-64">
				<p className="text-muted-foreground">No organization selected</p>
			</div>
		)
	}

	return (
		<div className="p-6 max-w-4xl">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-display text-2xl font-semibold">Team</h1>
					<p className="text-muted-foreground">
						Manage members and invitations for {currentOrg.name}
					</p>
				</div>
				{canManageTeam && (
					<Button onClick={() => setInviteOpen(true)}>
						<UserPlus className="mr-2 h-4 w-4" />
						Invite Member
					</Button>
				)}
			</div>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Members</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Joined</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{membersData?.members.map((member) => (
									<TableRow key={member.id}>
										<TableCell>
											<span className="font-medium">
												{member.userId === session?.user?.id
													? "You"
													: `User ${member.userId.slice(0, 8)}...`}
											</span>
										</TableCell>
										<TableCell>
											<Badge variant={getRoleBadgeVariant(member.role)}>
												{member.role}
											</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDistanceToNow(new Date(member.createdAt), {
												addSuffix: true,
											})}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{canManageTeam && (
					<Card>
						<CardHeader>
							<CardTitle>Pending Invitations</CardTitle>
						</CardHeader>
						<CardContent>
							{!invitesData?.invitations.length ? (
								<p className="text-muted-foreground text-sm py-4 text-center">
									No pending invitations
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Email</TableHead>
											<TableHead>Role</TableHead>
											<TableHead>Expires</TableHead>
											<TableHead className="w-10" />
										</TableRow>
									</TableHeader>
									<TableBody>
										{invitesData.invitations.map((invite) => (
											<TableRow key={invite.id}>
												<TableCell className="font-medium">
													{invite.email}
												</TableCell>
												<TableCell>
													<Badge variant={getRoleBadgeVariant(invite.role)}>
														{invite.role}
													</Badge>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{formatDistanceToNow(new Date(invite.expiresAt), {
														addSuffix: true,
													})}
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => handleResendInvite(invite.id)}
															>
																<RefreshCw className="mr-2 h-4 w-4" />
																Resend
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => setCancelId(invite.id)}
																className="text-destructive"
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Cancel
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			<InviteForm
				orgId={currentOrg.id}
				open={inviteOpen}
				onOpenChange={setInviteOpen}
			/>

			<AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel this invitation? The invite link
							will no longer work.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep Invitation</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancelInvite}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{cancelInvitation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Cancel Invitation
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
