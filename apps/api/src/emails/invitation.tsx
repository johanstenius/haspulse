import { Button, Section, Text } from "@react-email/components"
import { BaseEmail } from "./base.js"

type InvitationEmailProps = {
	orgName: string
	inviterName: string
	role: string
	url: string
}

export function InvitationEmail({
	orgName,
	inviterName,
	role,
	url,
}: InvitationEmailProps) {
	return (
		<BaseEmail preview={`You've been invited to join ${orgName}`}>
			<Section style={content}>
				<Text style={heading}>You're invited!</Text>
				<Text style={paragraph}>
					<strong>{inviterName}</strong> has invited you to join{" "}
					<strong>{orgName}</strong> on Haspulse as a <strong>{role}</strong>.
				</Text>
				<Text style={paragraph}>
					Haspulse is a monitoring service for cron jobs and scheduled tasks.
					Accept this invitation to start collaborating.
				</Text>
				<Button style={button} href={url}>
					Accept Invitation
				</Button>
				<Text style={note}>
					If you don't want to join this organization, you can ignore this
					email.
				</Text>
				<Text style={expiry}>This invitation expires in 7 days.</Text>
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
	margin: "0 0 16px",
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
	marginTop: "8px",
}

const note = {
	fontSize: "14px",
	color: "#6b7280",
	margin: "24px 0 0",
}

const expiry = {
	fontSize: "14px",
	color: "#6b7280",
	margin: "8px 0 0",
}
