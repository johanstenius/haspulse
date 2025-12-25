/**
 * Formats a date relative to now in a compact format.
 * @example "2m" for 2 minutes ago, "3h" for 3 hours ago, "5d" for 5 days ago
 */
export function formatRelativeCompact(date: Date | string): string {
	const now = new Date()
	const then = typeof date === "string" ? new Date(date) : date
	const diffMs = now.getTime() - then.getTime()

	const seconds = Math.floor(diffMs / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)
	const weeks = Math.floor(days / 7)
	const months = Math.floor(days / 30)

	if (seconds < 60) return `${seconds}s`
	if (minutes < 60) return `${minutes}m`
	if (hours < 24) return `${hours}h`
	if (days < 7) return `${days}d`
	if (weeks < 4) return `${weeks}w`
	return `${months}mo`
}

/**
 * Formats a date relative to now with "ago" suffix.
 * @example "2m ago", "3h ago", "5d ago"
 */
export function formatRelativeCompactAgo(date: Date | string): string {
	return `${formatRelativeCompact(date)} ago`
}
