/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { GroupController } from './group.controller'
import { GroupService } from './group.service'

@Module({
	controllers: [GroupController],
	providers: [GroupService, PrismaService],
	exports: [GroupService],
})
export class GroupModule {}
