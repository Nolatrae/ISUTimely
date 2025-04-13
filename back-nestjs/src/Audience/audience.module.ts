/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AudienceController } from './audience.controller';
import { AudienceService } from './audience.service';

@Module({
  controllers: [AudienceController],
  providers: [AudienceService, PrismaService],
  exports: [AudienceService],
})
export class AudienceModule {}
