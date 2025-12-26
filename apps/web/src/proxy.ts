import { type NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = [
	"/",
	"/login",
	"/register",
	"/verify-email",
	"/auth/verify-callback",
	"/auth/magic-link",
	"/auth/reset-password",
	"/status",
	"/docs",
	"/cron",
	"/manifest.webmanifest",
	"/icon.svg",
	"/robots.txt",
	"/sitemap.xml",
]

function isPublicPath(pathname: string): boolean {
	if (PUBLIC_PATHS.includes(pathname)) return true
	if (pathname.startsWith("/status/")) return true
	if (pathname.startsWith("/docs/")) return true
	if (pathname.startsWith("/cron/")) return true
	return false
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Allow public paths
	if (isPublicPath(pathname)) {
		return NextResponse.next()
	}

	// Check for BetterAuth session cookie (with or without __Secure- prefix)
	const sessionToken =
		request.cookies.get("__Secure-better-auth.session_token") ||
		request.cookies.get("better-auth.session_token")

	if (!sessionToken) {
		const loginUrl = new URL("/login", request.url)
		loginUrl.searchParams.set("redirect", pathname)
		return NextResponse.redirect(loginUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		// Match all paths except static files and api routes
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
}
