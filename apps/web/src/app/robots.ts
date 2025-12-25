import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://haspulse.io"

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/dashboard/", "/projects/"],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	}
}
