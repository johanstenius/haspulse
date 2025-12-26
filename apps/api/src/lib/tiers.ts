export type TierName = "free" | "pro"

export type TierLimits = {
	checks: number
	projects: number
	channelsPerProject: number
	apiKeysPerProject: number
	pingHistoryPerCheck: number
	pingRetentionDays: number
	pingBodyBytes: number
}

export type Tier = {
	name: TierName
	displayName: string
	price: number
	limits: TierLimits
}

export const TIERS: Record<TierName, Tier> = {
	free: {
		name: "free",
		displayName: "Free",
		price: 0,
		limits: {
			checks: 20,
			projects: 2,
			channelsPerProject: 3,
			apiKeysPerProject: 1,
			pingHistoryPerCheck: 50,
			pingRetentionDays: 90,
			pingBodyBytes: 100 * 1024, // 100KB
		},
	},
	pro: {
		name: "pro",
		displayName: "Pro",
		price: 1200, // $12.00 in cents
		limits: {
			checks: 100,
			projects: Number.POSITIVE_INFINITY,
			channelsPerProject: Number.POSITIVE_INFINITY,
			apiKeysPerProject: 5,
			pingHistoryPerCheck: 500,
			pingRetentionDays: 90,
			pingBodyBytes: 1024 * 1024, // 1MB
		},
	},
}

export function getTier(name: TierName): Tier {
	return TIERS[name]
}

export function getTierLimits(name: TierName): TierLimits {
	return TIERS[name].limits
}
