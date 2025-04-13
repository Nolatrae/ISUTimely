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
import { BuildingDto } from './building.dto';
import { BuildingService } from './building.service';

@Controller('building')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.buildingService.getById(id);
  }

  @Get()
  async getAll() {
    return await this.buildingService.getAll();
  }

  @Post()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() data: BuildingDto) {
    return await this.buildingService.create(data);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() data: BuildingDto) {
    return await this.buildingService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(204) // RESTful подход: успешное удаление возвращает 204 No Content
  async delete(@Param('id') id: string) {
    await this.buildingService.delete(id);
  }
}
