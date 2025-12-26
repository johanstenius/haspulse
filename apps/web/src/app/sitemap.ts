import { cronPatterns } from "@/data/cron-patterns"
import { integrations } from "@/data/integrations"
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://haspulse.dev"

	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${baseUrl}/login`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${baseUrl}/register`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/cron`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/integrations`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
	]

	const cronPages: MetadataRoute.Sitemap = cronPatterns.map((pattern) => ({
		url: `${baseUrl}/cron/${pattern.slug}`,
		lastModified: new Date(),
		changeFrequency: "monthly" as const,
		priority: 0.7,
	}))

	const integrationPages: MetadataRoute.Sitemap = integrations.map(
		(integration) => ({
			url: `${baseUrl}/integrations/${integration.slug}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.7,
		}),
	)

	return [...staticPages, ...cronPages, ...integrationPages]
}
