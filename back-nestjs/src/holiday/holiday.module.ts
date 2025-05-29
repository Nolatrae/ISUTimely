/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { HolidayController } from './holiday.controller'
import { HolidayService } from './holiday.service'

@Module({
	controllers: [HolidayController],
	providers: [HolidayService, PrismaService],
	exports: [HolidayService],
})
export class HolidayModule {}
