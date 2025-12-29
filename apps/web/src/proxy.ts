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

const MAIN_HOSTS = [
	"localhost",
	"localhost:3000",
	"haspulse.dev",
	"www.haspulse.dev",
	"app.haspulse.dev",
]

function isPublicPath(pathname: string): boolean {
	if (PUBLIC_PATHS.includes(pathname)) return true
	if (pathname.startsWith("/status/")) return true
	if (pathname.startsWith("/docs/")) return true
	if (pathname.startsWith("/cron/")) return true
	if (pathname.startsWith("/s/")) return true
	return false
}

function isMainHost(host: string): boolean {
	return MAIN_HOSTS.some((h) => host === h || host.startsWith(`${h}:`))
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl
	const host = request.headers.get("host") ?? ""

	// Handle custom domains - rewrite to status page by domain
	if (
		!isMainHost(host) &&
		!pathname.startsWith("/_next") &&
		!pathname.startsWith("/api") &&
		!pathname.includes(".")
	) {
		const url = request.nextUrl.clone()
		url.pathname = `/s/domain/${encodeURIComponent(host)}`
		return NextResponse.rewrite(url)
	}

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
