export type DocNavItem = {
	title: string
	href: string
}

export type DocNavSection = {
	title: string
	items: DocNavItem[]
}

export const docsNav: DocNavSection[] = [
	{
		title: "Getting Started",
		items: [
			{ title: "Introduction", href: "/docs" },
			{ title: "Quickstart", href: "/docs/quickstart" },
		],
	},
	{
		title: "SDK",
		items: [
			{ title: "Installation", href: "/docs/sdk" },
			{ title: "Pinging Checks", href: "/docs/sdk#pinging" },
			{ title: "Managing Checks", href: "/docs/sdk#checks" },
			{ title: "Channels", href: "/docs/sdk#channels" },
			{ title: "Error Handling", href: "/docs/sdk#errors" },
		],
	},
	{
		title: "Integrations",
		items: [
			{ title: "Overview", href: "/docs/integrations" },
			{ title: "Node.js", href: "/docs/integrations/node-js" },
			{ title: "TypeScript", href: "/docs/integrations/typescript" },
			{ title: "Python", href: "/docs/integrations/python" },
			{ title: "Go", href: "/docs/integrations/go" },
			{ title: "PHP", href: "/docs/integrations/php" },
			{ title: "Laravel", href: "/docs/integrations/laravel" },
			{ title: "Ruby on Rails", href: "/docs/integrations/rails" },
			{ title: "Bash", href: "/docs/integrations/bash" },
			{ title: "Docker", href: "/docs/integrations/docker" },
		],
	},
	{
		title: "Alert Channels",
		items: [
			{ title: "Overview", href: "/docs/alerts" },
			{ title: "Slack", href: "/docs/alerts/slack" },
			{ title: "Discord", href: "/docs/alerts/discord" },
			{ title: "PagerDuty", href: "/docs/alerts/pagerduty" },
			{ title: "Email", href: "/docs/alerts/email" },
			{ title: "Webhook", href: "/docs/alerts/webhook" },
		],
	},
	{
		title: "API Reference",
		items: [
			{ title: "Overview", href: "/docs/api" },
			{ title: "Authentication", href: "/docs/api#authentication" },
		],
	},
	{
		title: "More",
		items: [{ title: "Pricing", href: "/docs/pricing" }],
	},
]
