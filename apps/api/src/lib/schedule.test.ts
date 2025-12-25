import { describe, expect, it } from "vitest"
import { calculateNextExpected } from "./schedule.js"

describe("schedule", () => {
	describe("calculateNextExpected", () => {
		describe("PERIOD schedule", () => {
			it("adds seconds to from date", () => {
				const from = new Date("2025-01-07T12:00:00Z")
				const result = calculateNextExpected("PERIOD", "3600", from)

				expect(result).toEqual(new Date("2025-01-07T13:00:00Z"))
			})

			it("handles minutes as seconds", () => {
				const from = new Date("2025-01-07T12:00:00Z")
				const result = calculateNextExpected("PERIOD", "300", from)

				expect(result).toEqual(new Date("2025-01-07T12:05:00Z"))
			})

			it("throws on invalid period", () => {
				const from = new Date()
				expect(() => calculateNextExpected("PERIOD", "abc", from)).toThrow()
				expect(() => calculateNextExpected("PERIOD", "-100", from)).toThrow()
				expect(() => calculateNextExpected("PERIOD", "0", from)).toThrow()
			})
		})

		describe("CRON schedule", () => {
			it("calculates next run for daily cron", () => {
				const from = new Date("2025-01-07T12:00:00Z")
				const result = calculateNextExpected("CRON", "0 3 * * *", from, "UTC")

				expect(result).toEqual(new Date("2025-01-08T03:00:00Z"))
			})

			it("calculates next run same day if not passed", () => {
				const from = new Date("2025-01-07T02:00:00Z")
				const result = calculateNextExpected("CRON", "0 3 * * *", from, "UTC")

				expect(result).toEqual(new Date("2025-01-07T03:00:00Z"))
			})

			it("handles hourly cron", () => {
				const from = new Date("2025-01-07T12:30:00Z")
				const result = calculateNextExpected("CRON", "0 * * * *", from, "UTC")

				expect(result).toEqual(new Date("2025-01-07T13:00:00Z"))
			})

			it("respects timezone", () => {
				const from = new Date("2025-01-07T02:00:00Z")
				const result = calculateNextExpected(
					"CRON",
					"0 3 * * *",
					from,
					"America/New_York",
				)

				expect(result).toEqual(new Date("2025-01-07T08:00:00Z"))
			})
		})
	})
})
