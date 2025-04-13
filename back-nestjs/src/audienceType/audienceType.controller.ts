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
import { AudienceTypeDto } from './audienceType.dto';
import { AudienceTypeService } from './audienceType.service';

@Controller('audienceType')
export class AudienceTypeController {
  constructor(private readonly audienceTypeService: AudienceTypeService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.audienceTypeService.getById(id);
  }

  @Get()
  async getAll() {
    return await this.audienceTypeService.getAll();
  }

  @Post()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() data: AudienceTypeDto) {
    return await this.audienceTypeService.create(data);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() data: BuildingDto) {
    return await this.audienceTypeService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(204) // RESTful подход: успешное удаление возвращает 204 No Content
  async delete(@Param('id') id: string) {
    await this.audienceTypeService.delete(id);
  }
}
