/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'

import { ReportController } from './report.controller'
import { ReportService } from './report.service'

@Module({
	controllers: [ReportController],
	providers: [ReportService, PrismaService],
	exports: [ReportService],
})
export class ReportModule {}
