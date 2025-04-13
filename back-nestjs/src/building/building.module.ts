/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { BuildingController } from './building.controller';
import { BuildingService } from './building.service';

@Module({
  controllers: [BuildingController],
  providers: [BuildingService, PrismaService],
  exports: [BuildingService],
})
export class BuildingModule {}
