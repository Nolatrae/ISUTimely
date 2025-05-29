/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post } from '@nestjs/common'
import { HolidayService } from './holiday.service'

@Controller('holiday')
export class HolidayController {
	constructor(private readonly holidayService: HolidayService) {}

	@Post('one-time')
	async addHoliday(@Body() dto: any) {
		return this.holidayService.createHoliday(dto)
	}

	/** Постоянное мероприятие (еженедельно в один и тот же день недели) */
	@Post('recurring')
	async addRecurringHoliday(
		@Body()
		dto: {
			startDate: string
			endDate: string
			name: string
			roomId?: string
			timeSlots: string[]
		}
	) {
		return this.holidayService.createRecurringHoliday(dto)
	}

	@Get()
	async getAllHolidays() {
		return this.holidayService.getAllHolidays()
	}
}
