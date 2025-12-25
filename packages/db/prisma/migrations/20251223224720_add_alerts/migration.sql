/*
  Warnings:

  - You are about to drop the `check_integrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integrations` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "channel_type" AS ENUM ('EMAIL', 'SLACK', 'WEBHOOK');

-- DropForeignKey
ALTER TABLE "check_integrations" DROP CONSTRAINT "check_integrations_check_id_fkey";

-- DropForeignKey
ALTER TABLE "check_integrations" DROP CONSTRAINT "check_integrations_integration_id_fkey";

-- DropForeignKey
ALTER TABLE "integrations" DROP CONSTRAINT "integrations_project_id_fkey";

-- AlterTable
ALTER TABLE "checks" ADD COLUMN     "last_alert_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "check_integrations";

-- DropTable
DROP TABLE "integrations";

-- DropEnum
DROP TYPE "integration_type";

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL DEFAULT nanoid(16),
    "project_id" TEXT NOT NULL,
    "type" "channel_type" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_channels" (
    "check_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,

    CONSTRAINT "check_channels_pkey" PRIMARY KEY ("check_id","channel_id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL DEFAULT nanoid(16),
    "check_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channels" JSONB NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerts_check_id_created_at_idx" ON "alerts"("check_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_channels" ADD CONSTRAINT "check_channels_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_channels" ADD CONSTRAINT "check_channels_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
