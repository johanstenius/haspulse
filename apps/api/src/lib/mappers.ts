import type { ChannelModel } from "../services/channel.service.js"
import type { CheckModel } from "../services/check.service.js"
import type {
	IncidentModel,
	IncidentUpdateModel,
	IncidentWithUpdatesModel,
} from "../services/incident.service.js"
import type {
	MaintenanceModel,
	MaintenanceWithChecksModel,
} from "../services/maintenance.service.js"
import type {
	OrgMemberModel,
	OrgModel,
} from "../services/organization.service.js"
import type { ProjectModel } from "../services/project.service.js"

import type { ChannelResponse } from "../routes/v1/channels/channels.schemas.js"
import type { CheckResponse } from "../routes/v1/checks/checks.schemas.js"
import type {
	IncidentResponse,
	IncidentUpdateResponse,
	IncidentWithUpdatesResponse,
} from "../routes/v1/incidents/incidents.schemas.js"
import type {
	MaintenanceResponse,
	MaintenanceWithChecksResponse,
} from "../routes/v1/maintenance/maintenance.schemas.js"
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
		statusPageEnabled: project.statusPageEnabled,
		statusPageTitle: project.statusPageTitle,
		statusPageLogoUrl: project.statusPageLogoUrl,
		createdAt: project.createdAt.toISOString(),
		updatedAt: project.updatedAt.toISOString(),
	}
}

export function toCheckResponse(
	check: CheckModel,
	channelIds: string[],
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

export function toIncidentResponse(incident: IncidentModel): IncidentResponse {
	return {
		id: incident.id,
		projectId: incident.projectId,
		title: incident.title,
		status: incident.status,
		impact: incident.impact,
		autoCreated: incident.autoCreated,
		resolvedAt: toISOStringOrNull(incident.resolvedAt),
		createdAt: incident.createdAt.toISOString(),
		updatedAt: incident.updatedAt.toISOString(),
	}
}

export function toIncidentUpdateResponse(
	update: IncidentUpdateModel,
): IncidentUpdateResponse {
	return {
		id: update.id,
		incidentId: update.incidentId,
		status: update.status,
		message: update.message,
		createdAt: update.createdAt.toISOString(),
	}
}

export function toIncidentWithUpdatesResponse(
	incident: IncidentWithUpdatesModel,
): IncidentWithUpdatesResponse {
	return {
		...toIncidentResponse(incident),
		updates: incident.updates.map(toIncidentUpdateResponse),
		checkIds: incident.checkIds,
	}
}

export function toMaintenanceResponse(
	maintenance: MaintenanceModel,
): MaintenanceResponse {
	return {
		id: maintenance.id,
		projectId: maintenance.projectId,
		title: maintenance.title,
		description: maintenance.description,
		startsAt: maintenance.startsAt.toISOString(),
		endsAt: maintenance.endsAt.toISOString(),
		createdAt: maintenance.createdAt.toISOString(),
		updatedAt: maintenance.updatedAt.toISOString(),
	}
}

export function toMaintenanceWithChecksResponse(
	maintenance: MaintenanceWithChecksModel,
): MaintenanceWithChecksResponse {
	return {
		...toMaintenanceResponse(maintenance),
		checkIds: maintenance.checkIds,
	}
}

export function toOrgResponse(org: OrgModel): OrgResponse {
	return {
		id: org.id,
		name: org.name,
		slug: org.slug,
		plan: org.plan,
		trialEndsAt: toISOStringOrNull(org.trialEndsAt),
		autoCreateIncidents: org.autoCreateIncidents,
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
