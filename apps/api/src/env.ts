import env from "env-var"

export const config = {
	nodeEnv: env
		.get("NODE_ENV")
		.default("development")
		.asEnum(["development", "production", "test"]),
	port: env.get("PORT").default("4000").asPortNumber(),

	// Database
	databaseUrl: env.get("DATABASE_URL").required().asString(),

	// Auth
	authSecret: env.get("AUTH_SECRET").required().asString(),
	apiUrl: env.get("API_URL").default("http://localhost:4000").asString(),
	appUrl: env.get("APP_URL").default("http://localhost:4001").asString(),

	// OAuth (optional)
	googleClientId: env.get("GOOGLE_CLIENT_ID").asString(),
	googleClientSecret: env.get("GOOGLE_CLIENT_SECRET").asString(),
	githubClientId: env.get("GITHUB_CLIENT_ID").asString(),
	githubClientSecret: env.get("GITHUB_CLIENT_SECRET").asString(),

	// SendPigeon (optional - required for emails)
	sendpigeonApiKey: env.get("SENDPIGEON_API_KEY").asString(),
	sendpigeonFromAlerts: env
		.get("SENDPIGEON_FROM_ALERTS")
		.default("alerts@haspulse.dev")
		.asString(),
	sendpigeonFromNoreply: env
		.get("SENDPIGEON_FROM_NOREPLY")
		.default("noreply@haspulse.dev")
		.asString(),

	// Encryption (required for channel secrets)
	encryptionKey: env.get("ENCRYPTION_KEY").asString(),

	// Slack OAuth (optional)
	slackClientId: env.get("SLACK_CLIENT_ID").asString(),
	slackClientSecret: env.get("SLACK_CLIENT_SECRET").asString(),
}

export type Config = typeof config
