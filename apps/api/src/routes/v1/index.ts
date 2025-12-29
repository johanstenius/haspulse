import { OpenAPIHono } from "@hono/zod-openapi"
import type { AppEnv } from "../../app.js"
import { alertRoutes, cronJobAlertRoutes } from "./alerts/alerts.routes.js"
import { apiKeyRoutes } from "./api-keys/api-keys.routes.js"
import { billingRoutes } from "./billing/billing.routes.js"
import { channelRoutes } from "./channels/channels.routes.js"
import {
	cronJobRoutes,
	projectCronJobRoutes,
} from "./cron-jobs/cron-jobs.routes.js"
import { dashboardRoutes } from "./dashboard/dashboard.routes.js"
import {
	httpMonitorRoutes,
	projectHttpMonitorRoutes,
} from "./http-monitors/http-monitors.routes.js"
import { slackRoutes } from "./integrations/slack.routes.js"
import { invitationRoutes } from "./invitations/invitations.routes.js"
import { organizationRoutes } from "./organizations/organizations.routes.js"
import { pingHistoryRoutes } from "./pings/pings.routes.js"
import { projectRoutes } from "./projects/projects.routes.js"
import { statsRoutes } from "./stats/stats.routes.js"
import { incidentRoutes } from "./status-pages/incidents.routes.js"
import { maintenanceRoutes } from "./status-pages/maintenances.routes.js"
import { statusPageRoutes } from "./status-pages/status-pages.routes.js"

const v1Routes = new OpenAPIHono<AppEnv>()

v1Routes.route("/organizations", organizationRoutes)
v1Routes.route("/projects", projectRoutes)
v1Routes.route("/projects", projectCronJobRoutes) // list/create cron jobs under project
v1Routes.route("/projects", projectHttpMonitorRoutes) // list/create http monitors under project
v1Routes.route("/projects", channelRoutes)
v1Routes.route("/projects", apiKeyRoutes)
v1Routes.route("/projects", statusPageRoutes) // status page config and components
v1Routes.route("/projects", incidentRoutes) // incidents for status pages
v1Routes.route("/projects", maintenanceRoutes) // maintenances for status pages
v1Routes.route("/cron-jobs", cronJobRoutes) // get/update/delete/pause/resume by cron job id
v1Routes.route("/cron-jobs", pingHistoryRoutes)
v1Routes.route("/cron-jobs", statsRoutes)
v1Routes.route("/cron-jobs", cronJobAlertRoutes) // alerts for specific cron job
v1Routes.route("/http-monitors", httpMonitorRoutes) // get/update/delete/pause/resume by http monitor id
v1Routes.route("/alerts", alertRoutes) // org-wide alerts
v1Routes.route("/dashboard", dashboardRoutes)
v1Routes.route("/billing", billingRoutes)
v1Routes.route("/integrations/slack", slackRoutes)
v1Routes.route("/", invitationRoutes) // mounts at /organizations/{orgId}/invites and /invites/accept

export { v1Routes }
