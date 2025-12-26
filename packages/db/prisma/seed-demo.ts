import { subDays, subHours, subMinutes } from "date-fns"
import { PrismaClient } from "../src/generated/prisma/index.js"

const prisma = new PrismaClient()

const ORG_ID = "cmjkp671t00006dj7wuv2bisl"

async function main() {
	console.log("Seeding demo data for org:", ORG_ID)

	// Verify org exists
	const org = await prisma.organization.findUnique({ where: { id: ORG_ID } })
	if (!org) {
		throw new Error(`Organization ${ORG_ID} not found`)
	}
	console.log("Found org:", org.name)

	// Create projects
	const projects = await Promise.all([
		prisma.project.upsert({
			where: { slug: "production-api" },
			update: {},
			create: {
				orgId: ORG_ID,
				name: "Production API",
				slug: "production-api",
			},
		}),
		prisma.project.upsert({
			where: { slug: "data-pipeline" },
			update: {},
			create: {
				orgId: ORG_ID,
				name: "Data Pipeline",
				slug: "data-pipeline",
			},
		}),
	])
	console.log(
		"Created projects:",
		projects.map((p) => p.name),
	)

	const [prodProject, dataProject] = projects

	// Create checks for Production API
	const prodChecks = await Promise.all([
		prisma.check.upsert({
			where: {
				projectId_slug: { projectId: prodProject.id, slug: "db-backup" },
			},
			update: { status: "UP", lastPingAt: subMinutes(new Date(), 2) },
			create: {
				projectId: prodProject.id,
				name: "Database Backup",
				slug: "db-backup",
				scheduleType: "CRON",
				scheduleValue: "0 3 * * *",
				graceSeconds: 600,
				status: "UP",
				lastPingAt: subMinutes(new Date(), 2),
				nextExpectedAt: new Date(new Date().setHours(27, 0, 0, 0)),
			},
		}),
		prisma.check.upsert({
			where: {
				projectId_slug: { projectId: prodProject.id, slug: "email-queue" },
			},
			update: { status: "UP", lastPingAt: subMinutes(new Date(), 1) },
			create: {
				projectId: prodProject.id,
				name: "Email Queue Processor",
				slug: "email-queue",
				scheduleType: "CRON",
				scheduleValue: "*/5 * * * *",
				graceSeconds: 120,
				status: "UP",
				lastPingAt: subMinutes(new Date(), 1),
				nextExpectedAt: subMinutes(new Date(), -4),
			},
		}),
		prisma.check.upsert({
			where: {
				projectId_slug: { projectId: prodProject.id, slug: "ssl-renewal" },
			},
			update: { status: "LATE", lastPingAt: subHours(new Date(), 2) },
			create: {
				projectId: prodProject.id,
				name: "SSL Certificate Renewal",
				slug: "ssl-renewal",
				scheduleType: "CRON",
				scheduleValue: "0 9 * * 1",
				graceSeconds: 3600,
				status: "LATE",
				lastPingAt: subHours(new Date(), 2),
				nextExpectedAt: subHours(new Date(), 1),
			},
		}),
		prisma.check.upsert({
			where: {
				projectId_slug: { projectId: prodProject.id, slug: "analytics-sync" },
			},
			update: { status: "UP", lastPingAt: subMinutes(new Date(), 12) },
			create: {
				projectId: prodProject.id,
				name: "Analytics Sync",
				slug: "analytics-sync",
				scheduleType: "CRON",
				scheduleValue: "0 * * * *",
				graceSeconds: 300,
				status: "UP",
				lastPingAt: subMinutes(new Date(), 12),
				nextExpectedAt: subMinutes(new Date(), -48),
			},
		}),
		prisma.check.upsert({
			where: {
				projectId_slug: { projectId: prodProject.id, slug: "invoices" },
			},
			update: { status: "UP", lastPingAt: subMinutes(new Date(), 45) },
			create: {
				projectId: prodProject.id,
				name: "Invoice Generator",
				slug: "invoices",
				scheduleType: "CRON",
				scheduleValue: "0 * * * *",
				graceSeconds: 300,
				status: "UP",
				lastPingAt: subMinutes(new Date(), 45),
				nextExpectedAt: subMinutes(new Date(), -15),
			},
		}),
		prisma.check.upsert({
			where: { projectId_slug: { projectId: prodProject.id, slug: "sitemap" } },
			update: { status: "PAUSED" },
			create: {
				projectId: prodProject.id,
				name: "Sitemap Generator",
				slug: "sitemap",
				scheduleType: "CRON",
				scheduleValue: "0 6 * * *",
				graceSeconds: 600,
				status: "PAUSED",
				lastPingAt: subDays(new Date(), 3),
			},
		}),
	])
	console.log("Created prod checks:", prodChecks.length)

	// Create checks for Data Pipeline
	const dataChecks = await Promise.all([
		prisma.check.upsert({
			where: {
				projectId_slug: { projectId: dataProject.id, slug: "etl-daily" },
			},
			update: { status: "UP", lastPingAt: subHours(new Date(), 1) },
			create: {
				projectId: dataProject.id,
				name: "Daily ETL Job",
				slug: "etl-daily",
				scheduleType: "CRON",
				scheduleValue: "0 2 * * *",
				graceSeconds: 1800,
				status: "UP",
				lastPingAt: subHours(new Date(), 1),
				nextExpectedAt: new Date(new Date().setHours(26, 0, 0, 0)),
			},
		}),
		prisma.check.upsert({
			where: {
				projectId_slug: { projectId: dataProject.id, slug: "redis-heartbeat" },
			},
			update: { status: "UP", lastPingAt: subMinutes(new Date(), 0.5) },
			create: {
				projectId: dataProject.id,
				name: "Redis Heartbeat",
				slug: "redis-heartbeat",
				scheduleType: "PERIOD",
				scheduleValue: "60",
				graceSeconds: 30,
				status: "UP",
				lastPingAt: subMinutes(new Date(), 0.5),
				nextExpectedAt: subMinutes(new Date(), -1),
			},
		}),
		prisma.check.upsert({
			where: {
				projectId_slug: { projectId: dataProject.id, slug: "payment-sync" },
			},
			update: { status: "DOWN", lastPingAt: subMinutes(new Date(), 15) },
			create: {
				projectId: dataProject.id,
				name: "Payment Processor Sync",
				slug: "payment-sync",
				scheduleType: "CRON",
				scheduleValue: "*/5 * * * *",
				graceSeconds: 120,
				status: "DOWN",
				lastPingAt: subMinutes(new Date(), 15),
				nextExpectedAt: subMinutes(new Date(), 10),
				lastAlertAt: subMinutes(new Date(), 8),
			},
		}),
	])
	console.log("Created data pipeline checks:", dataChecks.length)

	// Create pings for checks (last 24 hours)
	const allChecks = [...prodChecks, ...dataChecks]
	for (const check of allChecks) {
		if (check.status === "PAUSED") continue

		const pingCount = check.status === "DOWN" ? 5 : 20
		const pings = []
		for (let i = 0; i < pingCount; i++) {
			pings.push({
				checkId: check.id,
				type:
					check.status === "DOWN" && i < 2
						? ("FAIL" as const)
						: ("SUCCESS" as const),
				sourceIp: "192.168.1.1",
				createdAt: subMinutes(new Date(), i * 30 + Math.random() * 10),
			})
		}
		await prisma.ping.createMany({ data: pings, skipDuplicates: true })
	}
	console.log("Created pings for checks")

	// Create daily stats for last 90 days
	for (const check of allChecks) {
		const stats = []
		for (let i = 0; i < 90; i++) {
			const date = subDays(new Date(), i)
			date.setHours(0, 0, 0, 0)

			// Simulate some variation
			let upPercent = 100
			if (check.status === "DOWN" && i < 3) {
				upPercent = 50 + Math.random() * 30
			} else if (check.status === "LATE" && i < 7) {
				upPercent = 85 + Math.random() * 10
			} else if (i === 15 || i === 45) {
				// Random incident days
				upPercent = 95 + Math.random() * 4
			} else if (check.status !== "PAUSED") {
				upPercent = 99 + Math.random()
			} else {
				upPercent = 0
			}

			const upMinutes = Math.round((upPercent / 100) * 1440)
			stats.push({
				checkId: check.id,
				date,
				upMinutes,
				downMinutes: 1440 - upMinutes,
				totalPings:
					check.status === "PAUSED" ? 0 : Math.floor(Math.random() * 50 + 20),
				upPercent,
			})
		}
		await prisma.checkDailyStat.createMany({
			data: stats,
			skipDuplicates: true,
		})
	}
	console.log("Created daily stats")

	// Create email channel for prod project
	await prisma.channel.upsert({
		where: { id: "demo-email-channel" },
		update: {},
		create: {
			id: "demo-email-channel",
			projectId: prodProject.id,
			type: "EMAIL",
			name: "Team Email",
			config: { emails: ["team@example.com"] },
		},
	})

	// Create webhook channel
	await prisma.channel.upsert({
		where: { id: "demo-webhook-channel" },
		update: {},
		create: {
			id: "demo-webhook-channel",
			projectId: prodProject.id,
			type: "WEBHOOK",
			name: "Slack Webhook",
			config: { url: "https://hooks.slack.com/services/xxx" },
		},
	})
	console.log("Created channels")

	// Link checks to channels
	for (const check of prodChecks.filter((c) => c.status !== "PAUSED")) {
		await prisma.checkChannel.upsert({
			where: {
				checkId_channelId: {
					checkId: check.id,
					channelId: "demo-email-channel",
				},
			},
			update: {},
			create: { checkId: check.id, channelId: "demo-email-channel" },
		})
	}
	console.log("Linked checks to channels")

	console.log("\n✅ Demo data seeded successfully!")
	console.log("   - 2 projects")
	console.log(`   - ${allChecks.length} checks (UP, LATE, DOWN, PAUSED)`)
	console.log("   - 90 days of uptime history")
	console.log("   - 2 notification channels")
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())
