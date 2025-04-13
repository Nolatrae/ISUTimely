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
import { EquipmentDto } from './equipment.dto';
import { EquipmentService } from './equipment.service';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.equipmentService.getById(id);
  }

  @Get()
  async getAll() {
    return await this.equipmentService.getAll();
  }

  @Post()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() data: EquipmentDto) {
    return await this.equipmentService.create(data);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() data: EquipmentDto) {
    return await this.equipmentService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(204) // RESTful подход: успешное удаление возвращает 204 No Content
  async delete(@Param('id') id: string) {
    await this.equipmentService.delete(id);
  }
}
