import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import env from "env-var"

const R2_ACCOUNT_ID = env.get("R2_ACCOUNT_ID").asString()
const R2_ACCESS_KEY_ID = env.get("R2_ACCESS_KEY_ID").asString()
const R2_SECRET_ACCESS_KEY = env.get("R2_SECRET_ACCESS_KEY").asString()
const R2_BUCKET_NAME = env.get("R2_BUCKET_NAME").default("haspulse").asString()
const R2_PUBLIC_URL = env
	.get("R2_PUBLIC_URL")
	.default("https://assets.haspulse.dev")
	.asString()

function getClient(): S3Client | null {
	if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
		return null
	}

	return new S3Client({
		region: "auto",
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		},
	})
}

export function isR2Configured(): boolean {
	return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)
}

export async function uploadFile(
	key: string,
	body: Buffer | Uint8Array,
	contentType: string,
): Promise<string> {
	const client = getClient()
	if (!client) {
		throw new Error("R2 storage not configured")
	}

	await client.send(
		new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			Body: body,
			ContentType: contentType,
			CacheControl: "public, max-age=31536000",
		}),
	)

	return `${R2_PUBLIC_URL}/${key}`
}

export async function deleteFile(key: string): Promise<void> {
	const client = getClient()
	if (!client) {
		throw new Error("R2 storage not configured")
	}

	await client.send(
		new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
		}),
	)
}

export function getKeyFromUrl(url: string): string | null {
	if (!url.startsWith(R2_PUBLIC_URL)) {
		return null
	}
	return url.slice(R2_PUBLIC_URL.length + 1)
}
