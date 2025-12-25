import { Section, Text } from "@react-email/components"
import { BaseEmail } from "./base.js"

type AlertEmailProps = {
	checkName: string
	projectName: string
	status: "DOWN" | "RECOVERED" | "STILL DOWN"
	lastPingAt: string | null
}

export function AlertEmail({
	checkName,
	projectName,
	status,
	lastPingAt,
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
