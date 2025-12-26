import { Section, Text } from "@react-email/components"
import { BaseEmail } from "./base.js"

type AlertContext = {
	duration?: {
		lastDurationMs: number | null
		last5Durations: number[]
		avgDurationMs: number | null
		trendDirection: "increasing" | "decreasing" | "stable" | "unknown"
		isAnomaly: boolean
		anomalyType?: "zscore" | "drift"
		zScore?: number
	}
	errorPattern?: {
		lastErrorSnippet: string | null
		errorCount24h: number
	}
	correlation?: {
		relatedFailures: Array<{
			checkId: string
			checkName: string
			failedAt: string
		}>
	}
}

type AlertEmailProps = {
	checkName: string
	projectName: string
	status: "DOWN" | "RECOVERED" | "STILL DOWN" | "FAILED"
	lastPingAt: string | null
	context?: AlertContext
}

function formatDuration(ms: number): string {
	const seconds = Math.round(ms / 1000)
	if (seconds < 60) return `${seconds}s`
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds % 60
	return remainingSeconds > 0
		? `${minutes}m ${remainingSeconds}s`
		: `${minutes}m`
}

export function AlertEmail({
	checkName,
	projectName,
	status,
	lastPingAt,
	context,
}: AlertEmailProps) {
	const isDown = status !== "RECOVERED"
	const emoji = isDown ? "\u{1F534}" : "\u{2705}"
	const preview = `${checkName} is ${status}`

	return (
		<BaseEmail preview={preview}>
			<Section style={content}>
				<Text style={heading}>
					{emoji} {checkName} is {status}
				</Text>
				<Section style={details}>
					<Text style={detailRow}>
						<span style={label}>Project:</span> {projectName}
					</Text>
					<Text style={detailRow}>
						<span style={label}>Check:</span> {checkName}
					</Text>
					<Text style={detailRow}>
						<span style={label}>Status:</span>{" "}
						<span style={isDown ? statusDown : statusUp}>{status}</span>
					</Text>
					{lastPingAt && (
						<Text style={detailRow}>
							<span style={label}>Last ping:</span> {lastPingAt}
						</Text>
					)}
				</Section>

				{context?.duration && context.duration.lastDurationMs !== null && (
					<Section style={contextSection}>
						<Text style={contextHeading}>Duration</Text>
						<Text style={detailRow}>
							<span style={label}>Last run:</span>{" "}
							{formatDuration(context.duration.lastDurationMs)}
							{context.duration.avgDurationMs && (
								<> (avg: {formatDuration(context.duration.avgDurationMs)})</>
							)}
							{context.duration.isAnomaly && (
								<span style={anomalyBadge}> ANOMALY</span>
							)}
						</Text>
						{context.duration.last5Durations.length > 0 && (
							<Text style={detailRow}>
								<span style={label}>Trend:</span>{" "}
								{context.duration.last5Durations
									.map(formatDuration)
									.join(" → ")}
							</Text>
						)}
					</Section>
				)}

				{context?.errorPattern?.lastErrorSnippet && (
					<Section style={contextSection}>
						<Text style={contextHeading}>Error Details</Text>
						<Text style={errorSnippet}>
							{context.errorPattern.lastErrorSnippet}
						</Text>
						{context.errorPattern.errorCount24h > 0 && (
							<Text style={detailRow}>
								<span style={label}>Errors in last 24h:</span>{" "}
								{context.errorPattern.errorCount24h}
							</Text>
						)}
					</Section>
				)}

				{context?.correlation?.relatedFailures &&
					context.correlation.relatedFailures.length > 0 && (
						<Section style={contextSection}>
							<Text style={contextHeading}>Related Failures</Text>
							<Text style={detailRow}>
								These checks also failed around the same time:
							</Text>
							{context.correlation.relatedFailures
								.slice(0, 5)
								.map((failure) => (
									<Text key={failure.checkId} style={relatedFailure}>
										• {failure.checkName}
									</Text>
								))}
						</Section>
					)}
			</Section>
		</BaseEmail>
	)
}

const content = {
	padding: "24px 48px",
}

const heading = {
	fontSize: "24px",
	fontWeight: "600" as const,
	color: "#0f172a",
	margin: "0 0 24px",
}

const details = {
	backgroundColor: "#f8fafc",
	borderRadius: "8px",
	padding: "16px 20px",
}

const detailRow = {
	fontSize: "14px",
	color: "#334155",
	margin: "0 0 8px",
}

const label = {
	fontWeight: "600" as const,
	color: "#64748b",
}

const statusDown = {
	color: "#dc2626",
	fontWeight: "600" as const,
}

const statusUp = {
	color: "#16a34a",
	fontWeight: "600" as const,
}

const contextSection = {
	marginTop: "20px",
	backgroundColor: "#fefce8",
	borderRadius: "8px",
	padding: "16px 20px",
	borderLeft: "4px solid #eab308",
}

const contextHeading = {
	fontSize: "14px",
	fontWeight: "600" as const,
	color: "#854d0e",
	margin: "0 0 12px",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
}

const anomalyBadge = {
	backgroundColor: "#fef2f2",
	color: "#dc2626",
	fontSize: "12px",
	fontWeight: "600" as const,
	padding: "2px 8px",
	borderRadius: "4px",
	marginLeft: "8px",
}

const errorSnippet = {
	fontSize: "12px",
	fontFamily: "monospace",
	backgroundColor: "#fef2f2",
	color: "#991b1b",
	padding: "12px",
	borderRadius: "4px",
	margin: "0 0 8px",
	whiteSpace: "pre-wrap" as const,
	wordBreak: "break-word" as const,
}

const relatedFailure = {
	fontSize: "14px",
	color: "#334155",
	margin: "0 0 4px",
	paddingLeft: "8px",
}
