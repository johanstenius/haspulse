export class HasPulseError extends Error {
	constructor(
		message: string,
		public code: string,
		public status: number,
	) {
		super(message)
		this.name = "HasPulseError"
	}
}

export class NotFoundError extends HasPulseError {
	constructor(message = "Resource not found") {
		super(message, "NOT_FOUND", 404)
		this.name = "NotFoundError"
	}
}

export class UnauthorizedError extends HasPulseError {
	constructor(message = "Unauthorized") {
		super(message, "UNAUTHORIZED", 401)
		this.name = "UnauthorizedError"
	}
}

export class ForbiddenError extends HasPulseError {
	constructor(message = "Forbidden") {
		super(message, "FORBIDDEN", 403)
		this.name = "ForbiddenError"
	}
}

export class BadRequestError extends HasPulseError {
	constructor(message = "Bad request") {
		super(message, "BAD_REQUEST", 400)
		this.name = "BadRequestError"
	}
}
