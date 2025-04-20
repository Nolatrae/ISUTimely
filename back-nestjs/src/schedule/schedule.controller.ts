import { WeekType } from '.prisma/client'
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { BulkScheduleDto } from './dto/bulk-schedule.dto'
import { ScheduleService } from './schedule.service'

@Controller('schedule')
export class ScheduleController {
	constructor(private readonly service: ScheduleService) {}

	/** Сохранить расписание группы bulk */
	@Post()
	async bulkCreate(@Body() dto: BulkScheduleDto) {
		return this.service.bulkCreate(dto)
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
		return this.service.findBusyRooms(audienceId, halfYear)
	}

	/** Занятость преподавателя: отдаем массив ScheduledPair */
	@Get('teacher/:teacherId/busy')
	async getBusyTeachers(
		@Param('teacherId') teacherId: string,
		@Query('halfYear') halfYear: string
	) {
		return this.service.findBusyTeachers(teacherId, halfYear)
	}
}
