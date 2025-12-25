import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type ShortcutHandler = () => void

type Shortcuts = {
	[key: string]: ShortcutHandler
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Ignore if user is typing in an input
			const target = e.target as HTMLElement
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return
			}

			const key = e.key.toLowerCase()
			const handler = shortcuts[key]

			if (handler) {
				e.preventDefault()
				handler()
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [shortcuts])
}

export function useGoToShortcuts() {
	const router = useRouter()
	const [pending, setPending] = useState<string | null>(null)

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			const target = e.target as HTMLElement
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return
			}

			const key = e.key.toLowerCase()

			// Two-key shortcuts: g + letter
			if (pending === "g") {
				e.preventDefault()
				setPending(null)

				switch (key) {
					case "d":
						router.push("/dashboard")
						break
					case "p":
						router.push("/projects")
						break
					case "s":
						router.push("/settings")
						break
					case "b":
						router.push("/settings/billing")
						break
				}
				return
			}

			if (key === "g") {
				e.preventDefault()
				setPending("g")
				// Clear pending after 1 second
				setTimeout(() => setPending(null), 1000)
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [pending, router])

	return { pending }
}

export function useHelpDialog() {
	const [open, setOpen] = useState(false)

	const toggle = useCallback(() => setOpen((prev) => !prev), [])
	const close = useCallback(() => setOpen(false), [])

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			const target = e.target as HTMLElement
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return
			}

			if (e.key === "?") {
				e.preventDefault()
				toggle()
			}

			if (e.key === "Escape" && open) {
				e.preventDefault()
				close()
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [open, toggle, close])

	return { open, setOpen, toggle, close }
}
