"use client"

import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import { useGoToShortcuts, useHelpDialog } from "@/lib/use-keyboard-shortcuts"
import type { ReactNode } from "react"

type KeyboardShortcutsProviderProps = {
	children: ReactNode
}

export function KeyboardShortcutsProvider({
	children,
}: KeyboardShortcutsProviderProps) {
	useGoToShortcuts()
	const { open, setOpen } = useHelpDialog()

	return (
		<>
			{children}
			<KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
		</>
	)
}
