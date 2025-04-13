/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PositionDto } from './position.dto';

@Injectable()
export class PositionService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const position = await this.prisma.position.findUnique({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }
    return position;
  }

  async getAll() {
    return await this.prisma.position.findMany();
  }

  async create(data: PositionDto) {
    const existingPosition = await this.prisma.position.findFirst({
      where: { title: data.title },
    });

    if (existingPosition) {
      throw new ConflictException(
        `Position with title '${data.title}' already exists`,
      );
    }

    return await this.prisma.position.create({ data });
  }

  async update(id: string, data: PositionDto) {
    const position = await this.prisma.position.findUnique({ where: { id } });

    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }

    const existingPosition = await this.prisma.position.findFirst({
      where: { title: data.title, NOT: { id } },
    });

    if (existingPosition) {
      throw new ConflictException(
        `Position with title '${data.title}' already exists`,
      );
    }

    return await this.prisma.position.update({ where: { id }, data });
  }

  async delete(id: string) {
    const position = await this.prisma.position.findUnique({ where: { id } });

    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }

    await this.prisma.position.delete({ where: { id } });

    return { message: `Position with ID ${id} successfully deleted` };
  }
}
