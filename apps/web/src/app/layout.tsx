import { Providers } from "@/components/providers"
import type { Metadata } from "next"
import { IBM_Plex_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["500", "600", "700"],
})

const inter = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
})

const ibmPlexMono = IBM_Plex_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	weight: ["400", "500"],
})

export const metadata: Metadata = {
	title: {
		default: "Haspulse — Cron monitoring that just works",
		template: "%s | Haspulse",
	},
	description:
		"Dead simple monitoring for cron jobs, scheduled tasks, and background workers. Get alerted before your users notice.",
	keywords: [
		"cron monitoring",
		"scheduled task monitoring",
		"uptime monitoring",
		"heartbeat monitoring",
		"background job monitoring",
		"dead mans switch",
		"job scheduler monitoring",
	],
	authors: [{ name: "Haspulse" }],
	creator: "Haspulse",
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL ?? "https://haspulse.dev",
	),
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "Haspulse",
		title: "Haspulse — Cron monitoring that just works",
		description:
			"Dead simple monitoring for cron jobs, scheduled tasks, and background workers. Get alerted before your users notice.",
		images: [
			{
				url: "/og-default.png",
				width: 1200,
				height: 630,
				alt: "Haspulse - Cron monitoring that just works",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Haspulse — Cron monitoring that just works",
		description:
			"Dead simple monitoring for cron jobs, scheduled tasks, and background workers.",
		images: ["/og-default.png"],
	},
	icons: {
		icon: [
			{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
			{ url: "/icon-192.png", sizes: "192x192", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
	},
	manifest: "/manifest.webmanifest",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${plusJakarta.variable} ${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
