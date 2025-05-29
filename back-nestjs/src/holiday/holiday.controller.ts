/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post } from '@nestjs/common'
import { HolidayService } from './holiday.service'

@Controller('holiday')
export class HolidayController {
	constructor(private readonly holidayService: HolidayService) {}

	@Post()
	async addHoliday(@Body() dto: any) {
		return this.holidayService.createHoliday(dto)
	}

	@Get()
	async getAllHolidays() {
		return this.holidayService.getAllHolidays()
	}
}
