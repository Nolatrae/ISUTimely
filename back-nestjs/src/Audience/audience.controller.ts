/* eslint-disable prettier/prettier */
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from '@nestjs/common'
import { AudienceDto, UpdateAudienceDto } from './audience.dto'
import { AudienceService } from './audience.service'

@Controller('audiences')
export class AudienceController {
	constructor(private readonly audienceService: AudienceService) {}

	@Post()
	async create(@Body() createAudienceDto: AudienceDto) {
		return await this.audienceService.create(createAudienceDto)
	}

	@Get()
	async getAll() {
		return await this.audienceService.getAll()
	}

	@Get(':id')
	async getById(@Param('id') id: string) {
		return await this.audienceService.getById(id)
	}

	@Patch(':id') // Был `Put`, теперь `Patch` для частичного обновления
	async update(
		@Param('id') id: string,
		@Body() updateAudienceDto: UpdateAudienceDto
	) {
		return await this.audienceService.update(id, updateAudienceDto)
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		return await this.audienceService.delete(id)
	}
}
