import type { ReactNode } from "react"

type PageHeaderProps = {
	title: string
	description?: string
	action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
	return (
		<div className="flex items-start justify-between gap-4 mb-6">
			<div>
				<h1 className="font-display text-2xl font-semibold">{title}</h1>
				{description && (
					<p className="text-muted-foreground">{description}</p>
				)}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	)
}
