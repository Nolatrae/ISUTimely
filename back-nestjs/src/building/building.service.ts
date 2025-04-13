/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { BuildingDto } from './building.dto';

@Injectable()
export class BuildingService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const building = await this.prisma.building.findUnique({ where: { id } });
    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }
    return building;
  }

  async getAll() {
    return await this.prisma.building.findMany();
  }

  async create(data: BuildingDto) {
    const existingBuilding = await this.prisma.building.findFirst({
      where: { title: data.title },
    });

    if (existingBuilding) {
      throw new ConflictException(
        `Building with title '${data.title}' already exists`,
      );
    }

    return await this.prisma.building.create({ data });
  }

  async update(id: string, data: BuildingDto) {
    const building = await this.prisma.building.findUnique({ where: { id } });

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    const existingBuilding = await this.prisma.building.findFirst({
      where: { title: data.title, NOT: { id } },
    });

    if (existingBuilding) {
      throw new ConflictException(
        `Building with title '${data.title}' already exists`,
      );
    }

    return await this.prisma.building.update({ where: { id }, data });
  }

  async delete(id: string) {
    const building = await this.prisma.building.findUnique({ where: { id } });

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    await this.prisma.building.delete({ where: { id } });

    return { message: `Building with ID ${id} successfully deleted` };
  }
}
