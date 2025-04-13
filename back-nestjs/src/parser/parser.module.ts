/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { UploadService } from './upload.service';

@Module({
  controllers: [ParserController],
  providers: [ParserService, PrismaService, UploadService],
  exports: [ParserService],
})
export class ParserModule {}
