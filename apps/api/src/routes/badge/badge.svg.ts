type StatusInfo = {
	label: string
	color: string
}

const STATUS_MAP: Record<string, StatusInfo> = {
	UP: { label: "operational", color: "#4c1" },
	DOWN: { label: "down", color: "#e05d44" },
	LATE: { label: "degraded", color: "#fe7d37" },
	NEW: { label: "unknown", color: "#9f9f9f" },
	PAUSED: { label: "paused", color: "#9f9f9f" },
}

function getTextWidth(text: string): number {
	return text.length * 6.5 + 10
}

function escapeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}

export function generateBadgeSvg(leftText: string, status: string): string {
	const statusInfo = STATUS_MAP[status] ?? STATUS_MAP.NEW
	const rightText = statusInfo?.label ?? "unknown"
	const rightColor = statusInfo?.color ?? "#9f9f9f"

	const leftWidth = getTextWidth(leftText)
	const rightWidth = getTextWidth(rightText)
	const totalWidth = leftWidth + rightWidth

	const escapedLeft = escapeXml(leftText)
	const escapedRight = escapeXml(rightText)

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${rightColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapedLeft}</text>
    <text x="${leftWidth / 2}" y="14">${escapedLeft}</text>
    <text x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapedRight}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14">${escapedRight}</text>
  </g>
</svg>`
}

export function getOverallStatus(statuses: string[]): string {
	if (statuses.length === 0) return "NEW"
	if (statuses.some((s) => s === "DOWN")) return "DOWN"
	if (statuses.some((s) => s === "LATE")) return "LATE"
	if (statuses.every((s) => s === "UP")) return "UP"
	if (statuses.every((s) => s === "PAUSED")) return "PAUSED"
	return "UP"
}
