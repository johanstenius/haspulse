export type ErrorCode =
	| "BAD_REQUEST"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "CONFLICT"
	| "LIMIT_EXCEEDED"
	| "INTERNAL_ERROR"

const statusCodes: Record<ErrorCode, number> = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	LIMIT_EXCEEDED: 403,
	INTERNAL_ERROR: 500,
}

export class AppError extends Error {
	readonly code: ErrorCode
	readonly status: number

	constructor(code: ErrorCode, message: string) {
		super(message)
		this.name = "AppError"
		this.code = code
		this.status = statusCodes[code]
	}
}

export function badRequest(message: string) {
	return new AppError("BAD_REQUEST", message)
}

export function unauthorized(message = "Unauthorized") {
	return new AppError("UNAUTHORIZED", message)
}

export function forbidden(message = "Forbidden") {
	return new AppError("FORBIDDEN", message)
}

export function notFound(message = "Not found") {
	return new AppError("NOT_FOUND", message)
}

export function conflict(message: string) {
	return new AppError("CONFLICT", message)
}

export function limitExceeded(
	resource: string,
	limit: number,
	current: number,
) {
	return new AppError(
		"LIMIT_EXCEEDED",
		`Limit exceeded: ${current}/${limit} ${resource}. Upgrade to Pro for higher limits.`,
	)
}
