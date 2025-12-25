import crypto from "node:crypto"
import { config } from "../env.js"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
	if (!config.encryptionKey) {
		throw new Error("ENCRYPTION_KEY not set")
	}
	return Buffer.from(config.encryptionKey, "base64")
}

export function encrypt(text: string): string {
	const key = getKey()
	const iv = crypto.randomBytes(IV_LENGTH)
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	})

	const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
	const authTag = cipher.getAuthTag()

	// Format: base64(iv + encrypted + authTag)
	return Buffer.concat([iv, encrypted, authTag]).toString("base64")
}

export function decrypt(encryptedText: string): string {
	const key = getKey()
	const data = Buffer.from(encryptedText, "base64")

	const iv = data.subarray(0, IV_LENGTH)
	const authTag = data.subarray(-AUTH_TAG_LENGTH)
	const encrypted = data.subarray(IV_LENGTH, -AUTH_TAG_LENGTH)

	const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	})
	decipher.setAuthTag(authTag)

	return decipher.update(encrypted) + decipher.final("utf8")
}

export function encryptConfig(
	config: Record<string, unknown>,
	fieldsToEncrypt: string[],
): Record<string, unknown> {
	const result = { ...config }
	for (const field of fieldsToEncrypt) {
		if (typeof result[field] === "string") {
			result[field] = encrypt(result[field])
		}
	}
	return result
}

export function decryptConfig(
	config: Record<string, unknown>,
	fieldsToDecrypt: string[],
): Record<string, unknown> {
	const result = { ...config }
	for (const field of fieldsToDecrypt) {
		if (typeof result[field] === "string") {
			try {
				result[field] = decrypt(result[field])
			} catch {
				// Field might not be encrypted (legacy data)
			}
		}
	}
	return result
}

export function generateEncryptionKey(): string {
	return crypto.randomBytes(32).toString("base64")
}
