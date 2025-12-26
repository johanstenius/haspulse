import {
	Body,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components"
import type { ReactNode } from "react"

type BaseEmailProps = {
	preview: string
	children: ReactNode
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Section style={header}>
						<Text style={logo}>HasPulse</Text>
					</Section>
					{children}
					<Section style={footer}>
						<Text style={footerText}>
							HasPulse - Cron job and heartbeat monitoring
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

const body = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
	maxWidth: "600px",
}

const header = {
	padding: "32px 48px 0",
}

const logo = {
	fontSize: "24px",
	fontWeight: "700" as const,
	color: "#0f172a",
	margin: "0",
}

const footer = {
	padding: "32px 48px",
	borderTop: "1px solid #e5e7eb",
	marginTop: "32px",
}

const footerText = {
	fontSize: "12px",
	color: "#6b7280",
	margin: "0",
}
