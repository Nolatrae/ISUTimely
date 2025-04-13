/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EquipmentDto } from './equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }
    return equipment;
  }

  async getAll() {
    return await this.prisma.equipment.findMany();
  }

  async create(data: EquipmentDto) {
    const existingEquipment = await this.prisma.equipment.findFirst({
      where: { title: data.title },
    });
    if (existingEquipment) {
      throw new ConflictException(
        `Equipment with title '${data.title}' already exists`,
      );
    }
    return await this.prisma.equipment.create({ data });
  }

  async update(id: string, data: EquipmentDto) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }
    const existingEquipment = await this.prisma.equipment.findFirst({
      where: { title: data.title, NOT: { id } },
    });
    if (existingEquipment) {
      throw new ConflictException(
        `Equipment with title '${data.title}' already exists`,
      );
    }
    return await this.prisma.equipment.update({ where: { id }, data });
  }

  async delete(id: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }
    await this.prisma.equipment.delete({ where: { id } });
    return { message: `Equipment with ID ${id} successfully deleted` };
  }
}
