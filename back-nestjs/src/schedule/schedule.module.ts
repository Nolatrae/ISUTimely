import { PrismaService } from '@/prisma.service'
import { Module } from '@nestjs/common'
import { ScheduleController } from './schedule.controller'
import { ScheduleService } from './schedule.service'

@Module({
	providers: [ScheduleService, PrismaService],
	controllers: [ScheduleController],
})
export class ScheduleModule {}
