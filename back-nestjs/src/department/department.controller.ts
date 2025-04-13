/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { DepartmentDto } from './department.dto';
import { DepartmentService } from './department.service';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  async create(@Body() createDepartmentDto: DepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  async getAll() {
    return this.departmentService.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.departmentService.getById(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() data: DepartmentDto) {
    return await this.departmentService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.departmentService.delete(id);
  }
}
