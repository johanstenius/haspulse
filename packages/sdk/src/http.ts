import {
	BadRequestError,
	ForbiddenError,
	HasPulseError,
	NotFoundError,
	UnauthorizedError,
} from "./errors.js"

type ApiError = {
	error: { code: string; message: string }
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
	url: string,
	options: RequestInit,
	timeout: number,
	retries: number,
): Promise<Response> {
	let lastError: Error | null = null

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), timeout)

			const response = await fetch(url, {
				...options,
				signal: controller.signal,
			})

			clearTimeout(timeoutId)
			return response
		} catch (error) {
			lastError = error as Error

			if ((error as Error).name === "AbortError" || attempt === retries) {
				break
			}

			await sleep(100 * 2 ** attempt)
		}
	}

	if (lastError?.name === "AbortError") {
		throw new HasPulseError("Request timeout", "TIMEOUT", 408)
	}

	throw new HasPulseError(
		lastError?.message ?? "Network error",
		"NETWORK_ERROR",
		0,
	)
}

export async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let errorData: ApiError | null = null
		try {
			errorData = await response.json()
		} catch (e) {
			console.warn(
				`[haspulse] Failed to parse error response: ${e instanceof Error ? e.message : "Unknown error"}`,
			)
		}

		const message = errorData?.error?.message ?? response.statusText
		const code = errorData?.error?.code ?? "UNKNOWN"

		switch (response.status) {
			case 400:
				throw new BadRequestError(message)
			case 401:
				throw new UnauthorizedError(message)
			case 403:
				throw new ForbiddenError(message)
			case 404:
				throw new NotFoundError(message)
			default:
				throw new HasPulseError(message, code, response.status)
		}
	}

	if (response.status === 204) {
		return undefined as T
	}

	return response.json()
}

export type RequestFn = <T>(
	method: string,
	path: string,
	body?: unknown,
) => Promise<T>
