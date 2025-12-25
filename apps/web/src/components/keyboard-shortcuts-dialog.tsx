"use client"

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

type KeyboardShortcutsDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const shortcuts = [
	{ keys: ["g", "d"], description: "Go to dashboard" },
	{ keys: ["g", "p"], description: "Go to projects" },
	{ keys: ["g", "s"], description: "Go to settings" },
	{ keys: ["g", "b"], description: "Go to billing" },
	{ keys: ["n"], description: "New item (context-dependent)" },
	{ keys: ["?"], description: "Show keyboard shortcuts" },
	{ keys: ["Esc"], description: "Close dialog" },
]

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-secondary border border-border rounded text-xs font-mono font-medium">
			{children}
		</kbd>
	)
}

export function KeyboardShortcutsDialog({
	open,
	onOpenChange,
}: KeyboardShortcutsDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Keyboard shortcuts</DialogTitle>
				</DialogHeader>
				<div className="space-y-3 py-4">
					{shortcuts.map((shortcut) => (
						<div
							key={shortcut.description}
							className="flex items-center justify-between"
						>
							<span className="text-sm text-muted-foreground">
								{shortcut.description}
							</span>
							<div className="flex items-center gap-1">
								{shortcut.keys.map((key, i) => (
									<span key={key} className="flex items-center gap-1">
										<Kbd>{key}</Kbd>
										{i < shortcut.keys.length - 1 && (
											<span className="text-muted-foreground text-xs">
												then
											</span>
										)}
									</span>
								))}
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
