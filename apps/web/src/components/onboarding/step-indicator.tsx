import { Check } from "lucide-react"

type StepIndicatorProps = {
	currentStep: number
	totalSteps: number
	labels?: string[]
}

export function StepIndicator({
	currentStep,
	totalSteps,
	labels,
}: StepIndicatorProps) {
	return (
		<div className="flex items-center gap-4">
			<div className="flex items-center gap-2">
				{Array.from({ length: totalSteps }, (_, i) => {
					const step = i + 1
					const isComplete = step < currentStep
					const isCurrent = step === currentStep

					return (
						<div
							key={step}
							className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
								isComplete
									? "bg-primary text-primary-foreground"
									: isCurrent
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground"
							}`}
						>
							{isComplete ? <Check className="h-4 w-4" /> : <span>{step}</span>}
						</div>
					)
				})}
			</div>
			<span className="text-sm text-muted-foreground">
				{labels?.[currentStep - 1] ?? `Step ${currentStep} of ${totalSteps}`}
			</span>
		</div>
	)
}
