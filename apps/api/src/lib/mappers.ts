import type { PingType } from "@haspulse/db"
import type { ChannelModel } from "../services/channel.service.js"
import type { CheckModel } from "../services/check.service.js"
import type { SparklineSlot } from "../services/sparkline.service.js"

export type RecentPing = {
	type: PingType
	createdAt: Date
}
import type { InvitationModel } from "../services/invitation.service.js"
import type {
	OrgMemberModel,
	OrgModel,
} from "../services/organization.service.js"
import type { ProjectModel } from "../services/project.service.js"

import type { ChannelResponse } from "../routes/v1/channels/channels.schemas.js"
import type { CheckResponse } from "../routes/v1/checks/checks.schemas.js"
import type { InvitationResponse } from "../routes/v1/invitations/invitations.schemas.js"
import type {
	OrgMemberResponse,
	OrgResponse,
} from "../routes/v1/organizations/organizations.schemas.js"
import type { ProjectResponse } from "../routes/v1/projects/projects.schemas.js"

function toISOStringOrNull(date: Date | null): string | null {
	return date?.toISOString() ?? null
}

export function toProjectResponse(project: ProjectModel): ProjectResponse {
	return {
		id: project.id,
		name: project.name,
		slug: project.slug,
		timezone: project.timezone,
		createdAt: project.createdAt.toISOString(),
		updatedAt: project.updatedAt.toISOString(),
	}
}

export function toCheckResponse(
	check: CheckModel,
	channelIds: string[],
	sparkline: SparklineSlot[] = [],
): CheckResponse {
	return {
		id: check.id,
		projectId: check.projectId,
		name: check.name,
		slug: check.slug,
		scheduleType: check.scheduleType,
		scheduleValue: check.scheduleValue,
		graceSeconds: check.graceSeconds,
		timezone: check.timezone,
		status: check.status,
		lastPingAt: toISOStringOrNull(check.lastPingAt),
		lastStartedAt: toISOStringOrNull(check.lastStartedAt),
		nextExpectedAt: toISOStringOrNull(check.nextExpectedAt),
		alertOnRecovery: check.alertOnRecovery,
		reminderIntervalHours: check.reminderIntervalHours,
		channelIds,
		sparkline,
		createdAt: check.createdAt.toISOString(),
		updatedAt: check.updatedAt.toISOString(),
	}
}

export function toChannelResponse(channel: ChannelModel): ChannelResponse {
	return {
		id: channel.id,
		projectId: channel.projectId,
		type: channel.type,
		name: channel.name,
		config: channel.config,
		createdAt: channel.createdAt.toISOString(),
		updatedAt: channel.updatedAt.toISOString(),
	}
}

export function toOrgResponse(org: OrgModel): OrgResponse {
	return {
		id: org.id,
		name: org.name,
		slug: org.slug,
		plan: org.plan,
		trialEndsAt: toISOStringOrNull(org.trialEndsAt),
		createdAt: org.createdAt.toISOString(),
		updatedAt: org.updatedAt.toISOString(),
	}
}

export function toOrgMemberResponse(member: OrgMemberModel): OrgMemberResponse {
	return {
		id: member.id,
		userId: member.userId,
		role: member.role,
		createdAt: member.createdAt.toISOString(),
	}
}

export function toInvitationResponse(
	invitation: InvitationModel,
): InvitationResponse {
	return {
		id: invitation.id,
		email: invitation.email,
		orgId: invitation.orgId,
		role: invitation.role,
		expiresAt: invitation.expiresAt.toISOString(),
		createdAt: invitation.createdAt.toISOString(),
	}
}
