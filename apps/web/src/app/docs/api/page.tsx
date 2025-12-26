import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "API Reference",
	description:
		"HasPulse REST API documentation. Authentication, endpoints, and examples.",
	keywords: [
		"haspulse api",
		"rest api",
		"api reference",
		"cron monitoring api",
	],
}

export default function ApiPage() {
	return (
		<article className="docs-prose">
			<h1>API Reference</h1>

			<p className="lead">
				The HasPulse REST API lets you manage checks, projects, and channels
				programmatically.
			</p>

			<div className="not-prose mb-8">
				<Button asChild variant="outline">
					<Link
						href="https://api.haspulse.dev/docs"
						target="_blank"
						rel="noopener"
					>
						Interactive API Docs (Swagger)
						<ExternalLink className="ml-2 h-4 w-4" />
					</Link>
				</Button>
			</div>

			<h2 id="authentication">Authentication</h2>

			<p>
				All API requests require authentication via an API key. Include your key
				in the <code>Authorization</code> header:
			</p>

			<pre>
				<code>Authorization: Bearer hp_your_api_key</code>
			</pre>

			<p>
				Create API keys in your project settings. Keys are scoped to a single
				project.
			</p>

			<h2>Base URL</h2>

			<pre>
				<code>https://api.haspulse.dev/v1</code>
			</pre>

			<h2>Endpoints</h2>

			<h3>Ping (Public)</h3>

			<p>Send pings to your checks. No authentication required.</p>

			<pre>
				<code>{`GET  /ping/:checkId          # Success ping
GET  /ping/:checkId/start    # Job started
GET  /ping/:checkId/fail     # Job failed
POST /ping/:checkId          # Success with body`}</code>
			</pre>

			<h3>Checks</h3>

			<pre>
				<code>{`GET    /v1/checks                    # List checks in project
GET    /v1/checks/:id                # Get check details
POST   /v1/checks                    # Create check
PATCH  /v1/checks/:id                # Update check
DELETE /v1/checks/:id                # Delete check
POST   /v1/checks/:id/pause          # Pause check
POST   /v1/checks/:id/resume         # Resume check
GET    /v1/checks/:id/stats          # Uptime stats`}</code>
			</pre>

			<h3>Projects</h3>

			<pre>
				<code>{`GET    /v1/projects                  # List projects
GET    /v1/projects/:id              # Get project
POST   /v1/projects                  # Create project
PATCH  /v1/projects/:id              # Update project
DELETE /v1/projects/:id              # Delete project`}</code>
			</pre>

			<h3>Channels</h3>

			<pre>
				<code>{`GET    /v1/channels                  # List channels
GET    /v1/channels/:id              # Get channel
POST   /v1/channels                  # Create channel
PATCH  /v1/channels/:id              # Update channel
DELETE /v1/channels/:id              # Delete channel
POST   /v1/channels/:id/test         # Send test notification`}</code>
			</pre>

			<h3>Organizations</h3>

			<pre>
				<code>{`GET    /v1/organizations             # List organizations
GET    /v1/organizations/:id         # Get organization
POST   /v1/organizations             # Create organization
PATCH  /v1/organizations/:id         # Update organization
DELETE /v1/organizations/:id         # Delete organization`}</code>
			</pre>

			<h3>API Keys</h3>

			<pre>
				<code>{`GET    /v1/api-keys                  # List API keys
POST   /v1/api-keys                  # Create API key
DELETE /v1/api-keys/:id              # Delete API key`}</code>
			</pre>

			<h2>Error Responses</h2>

			<p>
				All errors return a JSON object with <code>error</code> and{" "}
				<code>message</code> fields:
			</p>

			<pre>
				<code>{`{
  "error": "NOT_FOUND",
  "message": "Check not found"
}`}</code>
			</pre>

			<h3>Common Error Codes</h3>

			<ul>
				<li>
					<code>400</code> — Bad request (invalid input)
				</li>
				<li>
					<code>401</code> — Unauthorized (invalid or missing API key)
				</li>
				<li>
					<code>403</code> — Forbidden (no access to resource)
				</li>
				<li>
					<code>404</code> — Not found
				</li>
				<li>
					<code>429</code> — Rate limited
				</li>
				<li>
					<code>500</code> — Server error
				</li>
			</ul>

			<h2>Rate Limits</h2>

			<p>
				API requests are rate limited to 100 requests per minute per API key.
			</p>

			<p>
				Ping endpoints (<code>/ping/*</code>) have higher limits: 1000 requests
				per minute per check.
			</p>
		</article>
	)
}
