import { WeekType } from '.prisma/client'
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import {
	BulkScheduleDistanceDto,
	BulkScheduleDto,
} from './dto/bulk-schedule.dto'
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

	@Get('teacher/:teacherId/busy')
	async getBusyGroup(
		@Param('groupId') groupId: string,
		@Query('halfYear') halfYear: string
	) {
		const result = await this.service.findBusySelectedGroup(groupId, halfYear)
		return result
	}
}
