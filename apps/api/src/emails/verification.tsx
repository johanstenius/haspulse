import { Button, Section, Text } from "@react-email/components"
import { BaseEmail } from "./base.js"

type VerificationEmailProps = {
	url: string
}

export function VerificationEmail({ url }: VerificationEmailProps) {
	return (
		<BaseEmail preview="Verify your email address">
			<Section style={content}>
				<Text style={heading}>Verify your email</Text>
				<Text style={paragraph}>
					Click the button below to verify your email address and complete your
					Haspulse account setup.
				</Text>
				<Button style={button} href={url}>
					Verify Email
				</Button>
				<Text style={note}>
					If you didn't create a Haspulse account, you can ignore this email.
				</Text>
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
	margin: "0 0 16px",
}

const paragraph = {
	fontSize: "16px",
	lineHeight: "24px",
	color: "#334155",
	margin: "0 0 24px",
}

const button = {
	backgroundColor: "#0f172a",
	borderRadius: "6px",
	color: "#ffffff",
	fontSize: "16px",
	fontWeight: "600" as const,
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	padding: "12px 24px",
}

const note = {
	fontSize: "14px",
	color: "#6b7280",
	margin: "24px 0 0",
}
