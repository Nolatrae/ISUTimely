/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AudienceTypeController } from './audienceType.controller';
import { AudienceTypeService } from './audienceType.service';

@Module({
  controllers: [AudienceTypeController],
  providers: [AudienceTypeService, PrismaService],
  exports: [AudienceTypeService],
})
export class audienceTypeModule {}
