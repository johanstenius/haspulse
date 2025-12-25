"use client"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { useCreateInvitation } from "@/lib/query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const inviteFormSchema = z.object({
	email: z.string().email("Invalid email address"),
	role: z.enum(["admin", "member"]),
})

type InviteFormData = z.infer<typeof inviteFormSchema>

type InviteFormProps = {
	orgId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function InviteForm({ orgId, open, onOpenChange }: InviteFormProps) {
	const createInvitation = useCreateInvitation()

	const form = useForm<InviteFormData>({
		resolver: zodResolver(inviteFormSchema),
		defaultValues: {
			email: "",
			role: "member",
		},
	})

	async function onSubmit(data: InviteFormData) {
		try {
			await createInvitation.mutateAsync({ orgId, data })
			toast.success("Invitation sent")
			form.reset()
			onOpenChange(false)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to send invite")
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Invite Team Member</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="colleague@example.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="member">Member</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createInvitation.isPending}>
								{createInvitation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Send Invite
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
