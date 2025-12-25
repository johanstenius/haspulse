-- CreateEnum
CREATE TYPE "check_status" AS ENUM ('NEW', 'UP', 'LATE', 'DOWN', 'PAUSED');

-- CreateEnum
CREATE TYPE "ping_type" AS ENUM ('SUCCESS', 'START', 'FAIL');

-- CreateEnum
CREATE TYPE "schedule_type" AS ENUM ('PERIOD', 'CRON');

-- CreateEnum
CREATE TYPE "integration_type" AS ENUM ('EMAIL', 'SLACK', 'WEBHOOK');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL DEFAULT nanoid(16),
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status_page_enabled" BOOLEAN NOT NULL DEFAULT false,
    "status_page_title" TEXT,
    "status_page_logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checks" (
    "id" TEXT NOT NULL DEFAULT nanoid(16),
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "schedule_type" "schedule_type" NOT NULL,
    "schedule_value" TEXT NOT NULL,
    "grace_seconds" INTEGER NOT NULL DEFAULT 300,
    "timezone" TEXT,
    "status" "check_status" NOT NULL DEFAULT 'NEW',
    "last_ping_at" TIMESTAMP(3),
    "last_started_at" TIMESTAMP(3),
    "next_expected_at" TIMESTAMP(3),
    "alert_on_recovery" BOOLEAN NOT NULL DEFAULT true,
    "reminder_interval_hours" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pings" (
    "id" TEXT NOT NULL DEFAULT nanoid(16),
    "check_id" TEXT NOT NULL,
    "type" "ping_type" NOT NULL,
    "body" TEXT,
    "source_ip" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL DEFAULT nanoid(16),
    "project_id" TEXT NOT NULL,
    "type" "integration_type" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_integrations" (
    "check_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,

    CONSTRAINT "check_integrations_pkey" PRIMARY KEY ("check_id","integration_id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL DEFAULT nanoid(16),
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "checks_status_idx" ON "checks"("status");

-- CreateIndex
CREATE INDEX "checks_next_expected_at_idx" ON "checks"("next_expected_at");

-- CreateIndex
CREATE UNIQUE INDEX "checks_project_id_slug_key" ON "checks"("project_id", "slug");

-- CreateIndex
CREATE INDEX "pings_check_id_created_at_idx" ON "pings"("check_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pings" ADD CONSTRAINT "pings_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_integrations" ADD CONSTRAINT "check_integrations_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_integrations" ADD CONSTRAINT "check_integrations_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
