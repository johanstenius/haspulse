
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.1.0
 * Query Engine version: 11f085a2012c0f4778414c8db2651556ee0ef959
 */
Prisma.prismaVersion = {
  client: "6.1.0",
  engine: "11f085a2012c0f4778414c8db2651556ee0ef959"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  emailVerified: 'emailVerified',
  name: 'name',
  image: 'image',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  plan: 'plan',
  stripeCustomerId: 'stripeCustomerId',
  stripeSubscriptionId: 'stripeSubscriptionId',
  trialEndsAt: 'trialEndsAt',
  autoCreateIncidents: 'autoCreateIncidents',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrgMemberScalarFieldEnum = {
  id: 'id',
  role: 'role',
  userId: 'userId',
  orgId: 'orgId',
  createdAt: 'createdAt'
};

exports.Prisma.InvitationScalarFieldEnum = {
  id: 'id',
  email: 'email',
  orgId: 'orgId',
  role: 'role',
  token: 'token',
  expiresAt: 'expiresAt',
  acceptedAt: 'acceptedAt',
  createdAt: 'createdAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  accountId: 'accountId',
  providerId: 'providerId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  idToken: 'idToken',
  accessTokenExpiresAt: 'accessTokenExpiresAt',
  refreshTokenExpiresAt: 'refreshTokenExpiresAt',
  scope: 'scope',
  password: 'password',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationScalarFieldEnum = {
  id: 'id',
  identifier: 'identifier',
  value: 'value',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  orgId: 'orgId',
  name: 'name',
  slug: 'slug',
  timezone: 'timezone',
  statusPageEnabled: 'statusPageEnabled',
  statusPageTitle: 'statusPageTitle',
  statusPageLogoUrl: 'statusPageLogoUrl',
  customDomain: 'customDomain',
  domainVerified: 'domainVerified',
  domainVerifyToken: 'domainVerifyToken',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CheckScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  name: 'name',
  slug: 'slug',
  scheduleType: 'scheduleType',
  scheduleValue: 'scheduleValue',
  graceSeconds: 'graceSeconds',
  timezone: 'timezone',
  status: 'status',
  lastPingAt: 'lastPingAt',
  lastStartedAt: 'lastStartedAt',
  nextExpectedAt: 'nextExpectedAt',
  lastAlertAt: 'lastAlertAt',
  alertOnRecovery: 'alertOnRecovery',
  reminderIntervalHours: 'reminderIntervalHours',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PingScalarFieldEnum = {
  id: 'id',
  checkId: 'checkId',
  type: 'type',
  body: 'body',
  sourceIp: 'sourceIp',
  createdAt: 'createdAt'
};

exports.Prisma.CheckDailyStatScalarFieldEnum = {
  id: 'id',
  checkId: 'checkId',
  date: 'date',
  upMinutes: 'upMinutes',
  downMinutes: 'downMinutes',
  totalPings: 'totalPings',
  upPercent: 'upPercent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChannelScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  type: 'type',
  name: 'name',
  config: 'config',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CheckChannelScalarFieldEnum = {
  checkId: 'checkId',
  channelId: 'channelId'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  checkId: 'checkId',
  event: 'event',
  channels: 'channels',
  success: 'success',
  error: 'error',
  createdAt: 'createdAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  name: 'name',
  keyHash: 'keyHash',
  keyPrefix: 'keyPrefix',
  lastUsedAt: 'lastUsedAt',
  createdAt: 'createdAt'
};

exports.Prisma.IncidentScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  title: 'title',
  status: 'status',
  impact: 'impact',
  autoCreated: 'autoCreated',
  resolvedAt: 'resolvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.IncidentUpdateScalarFieldEnum = {
  id: 'id',
  incidentId: 'incidentId',
  status: 'status',
  message: 'message',
  createdAt: 'createdAt'
};

exports.Prisma.IncidentCheckScalarFieldEnum = {
  incidentId: 'incidentId',
  checkId: 'checkId'
};

exports.Prisma.MaintenanceScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  title: 'title',
  description: 'description',
  startsAt: 'startsAt',
  endsAt: 'endsAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MaintenanceCheckScalarFieldEnum = {
  maintenanceId: 'maintenanceId',
  checkId: 'checkId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.ScheduleType = exports.$Enums.ScheduleType = {
  PERIOD: 'PERIOD',
  CRON: 'CRON'
};

exports.CheckStatus = exports.$Enums.CheckStatus = {
  NEW: 'NEW',
  UP: 'UP',
  LATE: 'LATE',
  DOWN: 'DOWN',
  PAUSED: 'PAUSED'
};

exports.PingType = exports.$Enums.PingType = {
  SUCCESS: 'SUCCESS',
  START: 'START',
  FAIL: 'FAIL'
};

exports.ChannelType = exports.$Enums.ChannelType = {
  EMAIL: 'EMAIL',
  SLACK_WEBHOOK: 'SLACK_WEBHOOK',
  SLACK_APP: 'SLACK_APP',
  DISCORD: 'DISCORD',
  PAGERDUTY: 'PAGERDUTY',
  OPSGENIE: 'OPSGENIE',
  WEBHOOK: 'WEBHOOK'
};

exports.IncidentStatus = exports.$Enums.IncidentStatus = {
  INVESTIGATING: 'INVESTIGATING',
  IDENTIFIED: 'IDENTIFIED',
  MONITORING: 'MONITORING',
  RESOLVED: 'RESOLVED'
};

exports.IncidentImpact = exports.$Enums.IncidentImpact = {
  NONE: 'NONE',
  MINOR: 'MINOR',
  MAJOR: 'MAJOR',
  CRITICAL: 'CRITICAL'
};

exports.Prisma.ModelName = {
  User: 'User',
  Organization: 'Organization',
  OrgMember: 'OrgMember',
  Invitation: 'Invitation',
  Session: 'Session',
  Account: 'Account',
  Verification: 'Verification',
  Project: 'Project',
  Check: 'Check',
  Ping: 'Ping',
  CheckDailyStat: 'CheckDailyStat',
  Channel: 'Channel',
  CheckChannel: 'CheckChannel',
  Alert: 'Alert',
  ApiKey: 'ApiKey',
  Incident: 'Incident',
  IncidentUpdate: 'IncidentUpdate',
  IncidentCheck: 'IncidentCheck',
  Maintenance: 'Maintenance',
  MaintenanceCheck: 'MaintenanceCheck'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
