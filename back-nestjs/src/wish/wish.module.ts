/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { WishesController } from 'src/wish/wish.controller';
import { WishesService } from 'src/wish/wish.service';

@Module({
  controllers: [WishesController],
  providers: [WishesService, PrismaService],
  exports: [WishesService],
})
export class WishesModule {}
