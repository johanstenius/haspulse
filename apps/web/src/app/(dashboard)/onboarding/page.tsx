"use client"

import { PingTester } from "@/components/onboarding/ping-tester"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { type CronJob, type Project, type ScheduleType, api } from "@/lib/api"
import { useSession } from "@/lib/auth-client"
import {
	useCreateChannel,
	useCreateCronJob,
	useCreateProject,
} from "@/lib/query"
import { ArrowRight, Check as CheckIcon, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}

// Step 1: Project Form
const projectSchema = z.object({
	name: z.string().min(1, "Name is required"),
})

type ProjectFormValues = z.infer<typeof projectSchema>

// Step 2: Cron Job Form
const cronJobSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	scheduleType: z.enum(["PERIOD", "CRON"]),
	scheduleValue: z.string().min(1, "Schedule is required"),
})

type CronJobFormValues = z.infer<typeof cronJobSchema>

// Step 4: Alert Form
const alertSchema = z.object({
	enableEmail: z.boolean(),
})

type AlertFormValues = z.infer<typeof alertSchema>

type StepConfig = {
	title: string
	description: string
}

const STEPS: StepConfig[] = [
	{
		title: "Create your project",
		description: "Projects organize your cron jobs by app or service",
	},
	{
		title: "Add your first cron job",
		description: "Each cron job monitors one scheduled task",
	},
	{
		title: "Test your ping",
		description: "Send a test ping to verify it works",
	},
	{ title: "Set up alerts", description: "Choose where to get notified" },
]

export default function OnboardingPage() {
	const router = useRouter()
	const { data: session } = useSession()
	const [step, setStep] = useState(1)
	const [project, setProject] = useState<Project | null>(null)
	const [cronJob, setCronJob] = useState<CronJob | null>(null)
	const [apiKey, setApiKey] = useState<string | null>(null)

	const createProject = useCreateProject()
	const createCronJob = useCreateCronJob()
	const createChannel = useCreateChannel()

	// Step 1 form
	const projectForm = useForm<ProjectFormValues>({
		defaultValues: { name: "" },
	})
	const projectName = useWatch({ control: projectForm.control, name: "name" })

	// Step 2 form
	const cronJobForm = useForm<CronJobFormValues>({
		defaultValues: {
			name: "",
			slug: "",
			scheduleType: "PERIOD",
			scheduleValue: "86400",
		},
	})
	const cronJobName = useWatch({ control: cronJobForm.control, name: "name" })

	// Auto-generate slug from cron job name
	useEffect(() => {
		if (cronJobName) {
			cronJobForm.setValue("slug", slugify(cronJobName))
		}
	}, [cronJobName, cronJobForm])
	const scheduleType = useWatch({
		control: cronJobForm.control,
		name: "scheduleType",
	})

	// Step 4 form
	const alertForm = useForm<AlertFormValues>({
		defaultValues: { enableEmail: true },
	})

	async function handleProjectSubmit(values: ProjectFormValues) {
		const result = projectSchema.safeParse(values)
		if (!result.success) return

		try {
			const newProject = await createProject.mutateAsync({
				name: result.data.name,
				slug: slugify(result.data.name),
			})
			setProject(newProject)

			// Auto-create API key for pings
			const { fullKey } = await api.apiKeys.create(newProject.id, {
				name: "Default",
			})
			setApiKey(fullKey)

			setStep(2)
		} catch {
			toast.error("Failed to create project")
		}
	}

	async function handleCronJobSubmit(values: CronJobFormValues) {
		if (!project) return
		const result = cronJobSchema.safeParse(values)
		if (!result.success) return

		try {
			const newCronJob = await createCronJob.mutateAsync({
				projectId: project.id,
				data: {
					name: result.data.name,
					slug: result.data.slug,
					scheduleType: result.data.scheduleType as ScheduleType,
					scheduleValue: result.data.scheduleValue,
				},
			})
			setCronJob(newCronJob)
			setStep(3)
		} catch {
			toast.error("Failed to create cron job")
		}
	}

	const handlePingSuccess = useCallback(() => {
		setStep(4)
	}, [])

	const handlePingSkip = useCallback(() => {
		setStep(4)
	}, [])

	async function handleAlertSubmit(values: AlertFormValues) {
		if (!project || !cronJob) {
			router.push("/dashboard")
			return
		}

		const result = alertSchema.safeParse(values)
		if (!result.success) return

		try {
			if (result.data.enableEmail && session?.user?.email) {
				await createChannel.mutateAsync({
					projectId: project.id,
					data: {
						name: "Email alerts",
						type: "EMAIL",
						config: { email: session.user.email },
					},
				})
			}
			toast.success("You're all set!")
			router.push("/dashboard")
		} catch {
			toast.error("Failed to set up alerts")
			router.push("/dashboard")
		}
	}

	function skipOnboarding() {
		router.push("/dashboard")
	}

	const currentStep = STEPS[step - 1]
	const isLoading =
		createProject.isPending ||
		createCronJob.isPending ||
		createChannel.isPending

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-lg space-y-8">
				{/* Progress indicator */}
				<StepIndicator currentStep={step} totalSteps={4} />

				{/* Main card */}
				<Card>
					<CardHeader>
						<CardTitle>{currentStep.title}</CardTitle>
						<CardDescription>{currentStep.description}</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Step 1: Create Project */}
						{step === 1 && (
							<Form {...projectForm}>
								<form
									onSubmit={projectForm.handleSubmit(handleProjectSubmit)}
									className="space-y-6"
								>
									<FormField
										control={projectForm.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Project name</FormLabel>
												<FormControl>
													<Input placeholder="My Backend API" {...field} />
												</FormControl>
												<FormDescription>
													Status page: haspulse.dev/status/
													{slugify(projectName) || "..."}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="flex justify-between">
										<Button
											type="button"
											variant="ghost"
											onClick={skipOnboarding}
										>
											Skip
										</Button>
										<Button type="submit" disabled={isLoading}>
											{isLoading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<ArrowRight className="mr-2 h-4 w-4" />
											)}
											Continue
										</Button>
									</div>
								</form>
							</Form>
						)}

						{/* Step 2: Create Cron Job */}
						{step === 2 && (
							<Form {...cronJobForm}>
								<form
									onSubmit={cronJobForm.handleSubmit(handleCronJobSubmit)}
									className="space-y-6"
								>
									<FormField
										control={cronJobForm.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Cron job name</FormLabel>
												<FormControl>
													<Input placeholder="Database backup" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={cronJobForm.control}
											name="scheduleType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Schedule type</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="PERIOD">Period</SelectItem>
															<SelectItem value="CRON">Cron</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={cronJobForm.control}
											name="scheduleValue"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{scheduleType === "PERIOD"
															? "Interval (seconds)"
															: "Cron expression"}
													</FormLabel>
													<FormControl>
														<Input
															placeholder={
																scheduleType === "PERIOD"
																	? "86400"
																	: "0 3 * * *"
															}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="flex justify-between">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setStep(1)}
										>
											Back
										</Button>
										<Button type="submit" disabled={isLoading}>
											{isLoading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<ArrowRight className="mr-2 h-4 w-4" />
											)}
											Continue
										</Button>
									</div>
								</form>
							</Form>
						)}

						{/* Step 3: Test Ping */}
						{step === 3 && cronJob?.slug && apiKey && (
							<div className="space-y-6">
								<PingTester
									checkId={cronJob.id}
									slug={cronJob.slug}
									apiKey={apiKey}
									onSuccess={handlePingSuccess}
									onSkip={handlePingSkip}
								/>
							</div>
						)}

						{/* Step 4: Setup Alerts */}
						{step === 4 && (
							<Form {...alertForm}>
								<form
									onSubmit={alertForm.handleSubmit(handleAlertSubmit)}
									className="space-y-6"
								>
									<FormField
										control={alertForm.control}
										name="enableEmail"
										render={({ field }) => (
											<FormItem className="flex items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">
														Email alerts
													</FormLabel>
													<FormDescription>
														{session?.user?.email ?? "your email"}
													</FormDescription>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									<div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
										You can add Slack, Discord, and webhook alerts later from
										your project settings.
									</div>

									<div className="flex justify-between">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setStep(3)}
										>
											Back
										</Button>
										<Button type="submit" disabled={isLoading}>
											{isLoading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<CheckIcon className="mr-2 h-4 w-4" />
											)}
											Finish setup
										</Button>
									</div>
								</form>
							</Form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
