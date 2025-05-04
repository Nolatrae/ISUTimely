import { WeekType } from '.prisma/client'
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common'
import {
	BulkScheduleDistanceDto,
	BulkScheduleDto,
} from './dto/bulk-schedule.dto'
import { CreateScheduledPairDto } from './dto/create-scheduled-pair.dto'
import { UpdateScheduledPairDto } from './dto/update-scheduled-pair.dto'
import { ScheduleService } from './schedule.service'

@Controller('schedule')
export class ScheduleController {
	constructor(private readonly service: ScheduleService) {}

	/** Сохранить расписание группы bulk */
	@Post()
	async bulkCreate(@Body() dto: BulkScheduleDto) {
		return this.service.bulkCreate(dto)
	}

	@Post('distance')
	async bulkCreateDistance(@Body() dto: BulkScheduleDistanceDto) {
		return this.service.bulkCreateDistance(dto) // Новый метод для заочной группы
	}

	// Получение расписания заочной группы
	@Get('distance')
	async getDistanceSchedule(
		@Query('groupId') groupId: string,
		@Query('studyPlanId') studyPlanId: string,
		@Query('halfYear') halfYear: string
	) {
		const result = await this.service.getDistanceSchedule(
			groupId,
			studyPlanId,
			halfYear
		)
		return result
	}

	/** Получить расписание группы */
	@Get('group/:groupId')
	async getByGroup(
		@Param('groupId') groupId: string,
		@Query('halfYear') halfYear: string,
		@Query('weekType') weekType: WeekType
	) {
		return this.service.findByGroup(groupId, halfYear, weekType)
	}

	/** Занятость кабинета: отдаем массив ScheduledPair */
	@Get('room/:audienceId/busy')
	async getBusyRooms(
		@Param('audienceId') audienceId: string,
		@Query('halfYear') halfYear: string
	) {
		const result = await this.service.findBusyRooms(audienceId, halfYear)
		return result
	}

	/** Занятость преподавателя: отдаем массив ScheduledPair */
	@Get('teacher/:teacherId/busy')
	async getBusyTeachers(
		@Param('teacherId') teacherId: string,
		@Query('halfYear') halfYear: string
	) {
		const result = await this.service.findBusyTeachers(teacherId, halfYear)
		return result
	}

	@Get('group/:groupId/busy')
	async getBusyGroup(
		@Param('groupId') groupId: string,
		@Query('halfYear') halfYear: string
	) {
		console.log(groupId, halfYear)
		const result = await this.service.findBusySelectedGroup(groupId, halfYear)
		return result
	}

	/** Создать одну запись ScheduledPair */
	@Post('pair')
	async createPair(@Body() dto: CreateScheduledPairDto): Promise<any> {
		return this.service.createScheduledPair(dto)
	}

	/** Обновить существующую запись ScheduledPair */
	@Patch('pair/:id')
	async updatePair(
		@Param('id') id: string,
		@Body() dto: UpdateScheduledPairDto
	): Promise<any> {
		return this.service.updateScheduledPair(id, dto)
	}

	/** Удалить запись ScheduledPair */
	@Delete('pair/:id')
	async deletePair(@Param('id') id: string): Promise<void> {
		return this.service.deleteScheduledPair(id)
	}
}
