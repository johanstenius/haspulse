"use client"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Project } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

const projectFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z
		.string()
		.min(1, "Slug is required")
		.regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and dashes only"),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

type ProjectFormProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: { name: string; slug: string; timezone?: string }) => void
	project?: Project
	isLoading?: boolean
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}

export function ProjectForm({
	open,
	onOpenChange,
	onSubmit,
	project,
	isLoading,
}: ProjectFormProps) {
	const form = useForm<ProjectFormValues>({
		defaultValues: {
			name: "",
			slug: "",
		},
	})

	const isEdit = !!project
	const name = useWatch({ control: form.control, name: "name" })

	useEffect(() => {
		if (open) {
			form.reset({
				name: project?.name ?? "",
				slug: project?.slug ?? "",
			})
		}
	}, [open, project, form])

	// Auto-generate slug from name when creating (not editing)
	useEffect(() => {
		if (!isEdit && name && !form.formState.dirtyFields.slug) {
			form.setValue("slug", slugify(name), { shouldValidate: true })
		}
	}, [name, isEdit, form])

	function handleSubmit(values: ProjectFormValues) {
		const result = projectFormSchema.safeParse(values)
		if (!result.success) {
			for (const issue of result.error.issues) {
				const path = issue.path[0] as keyof ProjectFormValues
				form.setError(path, { message: issue.message })
			}
			return
		}
		onSubmit(result.data)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit project" : "Create project"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update your project details."
							: "Create a new project to organize your checks."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)}>
						<div className="space-y-4 py-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="My Project" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="slug"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Slug</FormLabel>
										<FormControl>
											<Input placeholder="my-project" {...field} />
										</FormControl>
										<FormDescription>
											Used in status page URL: haspulse.dev/status/
											{field.value || "..."}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{isEdit ? "Save" : "Create"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
