/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { BuildingDto } from 'src/building/building.dto';
import { PositionDto } from './position.dto';
import { PositionService } from './position.service';

@Controller('position')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.positionService.getById(id);
  }

  @Get()
  async getAll() {
    return await this.positionService.getAll();
  }

  @Post()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() data: PositionDto) {
    return await this.positionService.create(data);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() data: BuildingDto) {
    return await this.positionService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(204) // RESTful подход: успешное удаление возвращает 204 No Content
  async delete(@Param('id') id: string) {
    await this.positionService.delete(id);
  }
}
