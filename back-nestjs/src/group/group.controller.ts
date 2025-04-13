/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { GroupDto } from './group.dto'
import { GroupService } from './group.service'

@Controller('groups')
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	// Создать группу
	@Post()
	async create(@Body() createGroupDto: GroupDto) {
		return this.groupService.create(createGroupDto)
	}

	// Получить все группы
	@Get()
	async getAll() {
		return this.groupService.getAll()
	}

	@Get(':id')
	async getById(@Param('id') id: string) {
		return this.groupService.getById(id)
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() data: GroupDto) {
		return await this.groupService.update(id, data)
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		return this.groupService.delete(id)
	}
}
