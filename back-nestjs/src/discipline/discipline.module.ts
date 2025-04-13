/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DisciplineController } from './discipline.controller';
import { DisciplineService } from './discipline.service';

@Module({
  controllers: [DisciplineController],
  providers: [DisciplineService, PrismaService],
})
export class DisciplineModule {}
