import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "HasPulse — Cron monitoring that just works"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
	return new ImageResponse(
		<div
			style={{
				background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "16px",
					marginBottom: "32px",
				}}
			>
				<svg
					role="img"
					aria-label="HasPulse logo"
					width="64"
					height="64"
					viewBox="0 0 32 32"
					style={{ borderRadius: "12px" }}
				>
					<rect width="32" height="32" rx="6" fill="#10b981" />
					<path
						d="M8 16.5L13 21.5L24 10.5"
						stroke="white"
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
						fill="none"
					/>
				</svg>
				<span
					style={{
						fontSize: "48px",
						fontWeight: 700,
						color: "white",
						letterSpacing: "-0.02em",
					}}
				>
					HasPulse
				</span>
			</div>
			<div
				style={{
					fontSize: "32px",
					color: "#a1a1aa",
					textAlign: "center",
					maxWidth: "800px",
					lineHeight: 1.4,
				}}
			>
				Cron monitoring that just works
			</div>
			<div
				style={{
					display: "flex",
					gap: "24px",
					marginTop: "48px",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						background: "#27272a",
						padding: "12px 20px",
						borderRadius: "8px",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#10b981",
						}}
					/>
					<span style={{ color: "#fafafa", fontSize: "18px" }}>
						Instant alerts
					</span>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						background: "#27272a",
						padding: "12px 20px",
						borderRadius: "8px",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#10b981",
						}}
					/>
					<span style={{ color: "#fafafa", fontSize: "18px" }}>
						Status pages
					</span>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						background: "#27272a",
						padding: "12px 20px",
						borderRadius: "8px",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#10b981",
						}}
					/>
					<span style={{ color: "#fafafa", fontSize: "18px" }}>
						Simple setup
					</span>
				</div>
			</div>
		</div>,
		{ ...size },
	)
}
