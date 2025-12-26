import { OpenAPIHono } from "@hono/zod-openapi"
import type { AppEnv } from "../../app.js"
import { alertRoutes, checkAlertRoutes } from "./alerts/alerts.routes.js"
import { apiKeyRoutes } from "./api-keys/api-keys.routes.js"
import { billingRoutes } from "./billing/billing.routes.js"
import { channelRoutes } from "./channels/channels.routes.js"
import { checkRoutes, projectCheckRoutes } from "./checks/checks.routes.js"
import { dashboardRoutes } from "./dashboard/dashboard.routes.js"
import { slackRoutes } from "./integrations/slack.routes.js"
import { invitationRoutes } from "./invitations/invitations.routes.js"
import { organizationRoutes } from "./organizations/organizations.routes.js"
import { pingHistoryRoutes } from "./pings/pings.routes.js"
import { projectRoutes } from "./projects/projects.routes.js"
import { statsRoutes } from "./stats/stats.routes.js"

const v1Routes = new OpenAPIHono<AppEnv>()

v1Routes.route("/organizations", organizationRoutes)
v1Routes.route("/projects", projectRoutes)
v1Routes.route("/projects", projectCheckRoutes) // list/create checks under project
v1Routes.route("/projects", channelRoutes)
v1Routes.route("/projects", apiKeyRoutes)
v1Routes.route("/checks", checkRoutes) // get/update/delete/pause/resume by check id
v1Routes.route("/checks", pingHistoryRoutes)
v1Routes.route("/checks", statsRoutes)
v1Routes.route("/checks", checkAlertRoutes) // alerts for specific check
v1Routes.route("/alerts", alertRoutes) // org-wide alerts
v1Routes.route("/dashboard", dashboardRoutes)
v1Routes.route("/billing", billingRoutes)
v1Routes.route("/integrations/slack", slackRoutes)
v1Routes.route("/", invitationRoutes) // mounts at /organizations/{orgId}/invites and /invites/accept

export { v1Routes }
