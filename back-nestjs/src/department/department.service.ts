/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DepartmentDto } from './department.dto';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  async getAll() {
    return await this.prisma.department.findMany();
  }

  async create(data: DepartmentDto) {
    const existingDepartment = await this.prisma.department.findFirst({
      where: { title: data.title },
    });

    if (existingDepartment) {
      throw new ConflictException(
        `Department with title '${data.title}' already exists`,
      );
    }

    return await this.prisma.department.create({ data });
  }

  async update(id: string, data: DepartmentDto) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    const existingDepartment = await this.prisma.department.findFirst({
      where: { title: data.title, NOT: { id } },
    });

    if (existingDepartment) {
      throw new ConflictException(
        `Department with title '${data.title}' already exists`,
      );
    }

    return await this.prisma.department.update({ where: { id }, data });
  }

  async delete(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    await this.prisma.department.delete({ where: { id } });

    return { message: `Department with ID ${id} successfully deleted` };
  }
}
