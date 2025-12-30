import { type ChannelType, type Prisma, prisma } from "@haspulse/db"
import type {
	ChannelModel,
	CreateChannelInput,
	UpdateChannelInput,
} from "../services/channel.service.js"

function toChannelModel(channel: {
	id: string
	projectId: string
	type: ChannelType
	name: string
	config: unknown
	isDefault: boolean
	createdAt: Date
	updatedAt: Date
}): ChannelModel {
	return {
		id: channel.id,
		projectId: channel.projectId,
		type: channel.type,
		name: channel.name,
		config: channel.config as Record<string, unknown>,
		isDefault: channel.isDefault,
		createdAt: channel.createdAt,
		updatedAt: channel.updatedAt,
	}
}

export const channelRepository = {
	async create(input: CreateChannelInput): Promise<ChannelModel> {
		const channel = await prisma.channel.create({
			data: {
				projectId: input.projectId,
				type: input.type,
				name: input.name,
				config: input.config as Prisma.InputJsonValue,
				isDefault: input.isDefault ?? false,
			},
		})
		return toChannelModel(channel)
	},

	async findById(id: string): Promise<ChannelModel | null> {
		const channel = await prisma.channel.findUnique({ where: { id } })
		return channel ? toChannelModel(channel) : null
	},

	async findByProjectId(projectId: string): Promise<ChannelModel[]> {
		const channels = await prisma.channel.findMany({
			where: { projectId },
			orderBy: { createdAt: "desc" },
		})
		return channels.map(toChannelModel)
	},

	async findByProjectIdPaginated(
		projectId: string,
		page: number,
		limit: number,
	): Promise<{ data: ChannelModel[]; total: number }> {
		const [channels, total] = await Promise.all([
			prisma.channel.findMany({
				where: { projectId },
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.channel.count({ where: { projectId } }),
		])
		return { data: channels.map(toChannelModel), total }
	},

	async update(id: string, input: UpdateChannelInput): Promise<ChannelModel> {
		const channel = await prisma.channel.update({
			where: { id },
			data: {
				name: input.name,
				config: input.config as Prisma.InputJsonValue | undefined,
				isDefault: input.isDefault,
			},
		})
		return toChannelModel(channel)
	},

	async delete(id: string): Promise<void> {
		await prisma.channel.delete({ where: { id } })
	},

	async findByCronJobId(cronJobId: string): Promise<ChannelModel[]> {
		const channels = await prisma.channel.findMany({
			where: {
				cronJobChannels: {
					some: { cronJobId },
				},
			},
		})
		return channels.map(toChannelModel)
	},

	async findByHttpMonitorId(httpMonitorId: string): Promise<ChannelModel[]> {
		const channels = await prisma.channel.findMany({
			where: {
				httpMonitorChannels: {
					some: { httpMonitorId },
				},
			},
		})
		return channels.map(toChannelModel)
	},

	async findDefaultByProjectId(projectId: string): Promise<ChannelModel[]> {
		const channels = await prisma.channel.findMany({
			where: { projectId, isDefault: true },
		})
		return channels.map(toChannelModel)
	},
}
