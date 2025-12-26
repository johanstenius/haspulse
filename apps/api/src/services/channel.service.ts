import type { ChannelType } from "@haspulse/db"
import { channelRepository } from "../repositories/channel.repository.js"

export type ChannelModel = {
	id: string
	projectId: string
	type: ChannelType
	name: string
	config: Record<string, unknown>
	isDefault: boolean
	createdAt: Date
	updatedAt: Date
}

export type CreateChannelInput = {
	projectId: string
	type: ChannelType
	name: string
	config: Record<string, unknown>
	isDefault?: boolean
}

export type UpdateChannelInput = {
	name?: string
	config?: Record<string, unknown>
	isDefault?: boolean
}

export async function createChannel(
	input: CreateChannelInput,
): Promise<ChannelModel> {
	return channelRepository.create(input)
}

export async function getChannelById(id: string): Promise<ChannelModel | null> {
	return channelRepository.findById(id)
}

export async function listChannelsByProject(
	projectId: string,
): Promise<ChannelModel[]> {
	return channelRepository.findByProjectId(projectId)
}

export async function listChannelsByProjectPaginated(
	projectId: string,
	page: number,
	limit: number,
): Promise<{ data: ChannelModel[]; total: number }> {
	return channelRepository.findByProjectIdPaginated(projectId, page, limit)
}

export async function updateChannel(
	id: string,
	input: UpdateChannelInput,
): Promise<ChannelModel> {
	return channelRepository.update(id, input)
}

export async function deleteChannel(id: string): Promise<void> {
	await channelRepository.delete(id)
}

export async function listChannelsByCheck(
	checkId: string,
): Promise<ChannelModel[]> {
	return channelRepository.findByCheckId(checkId)
}

export async function listDefaultChannelsByProject(
	projectId: string,
): Promise<ChannelModel[]> {
	return channelRepository.findDefaultByProjectId(projectId)
}
