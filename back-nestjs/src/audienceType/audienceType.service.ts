/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AudienceTypeDto } from './audienceType.dto';

@Injectable()
export class AudienceTypeService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const audienceType = await this.prisma.audienceType.findUnique({
      where: { id },
    });
    if (!audienceType) {
      throw new NotFoundException(`AudienceType with ID ${id} not found`);
    }
    return audienceType;
  }

  async getAll() {
    return await this.prisma.audienceType.findMany();
  }

  async create(data: AudienceTypeDto) {
    const existingAudienceType = await this.prisma.audienceType.findFirst({
      where: { title: data.title },
    });

    if (existingAudienceType) {
      throw new ConflictException(
        `AudienceType with title '${data.title}' already exists`,
      );
    }

    return await this.prisma.audienceType.create({ data });
  }

  async update(id: string, data: AudienceTypeDto) {
    const audienceType = await this.prisma.audienceType.findUnique({
      where: { id },
    });

    if (!audienceType) {
      throw new NotFoundException(`AudienceType with ID ${id} not found`);
    }

    const existingAudienceType = await this.prisma.audienceType.findFirst({
      where: { title: data.title, NOT: { id } },
    });

    if (existingAudienceType) {
      throw new ConflictException(
        `AudienceType with title '${data.title}' already exists`,
      );
    }

    return await this.prisma.audienceType.update({ where: { id }, data });
  }

  async delete(id: string) {
    const audienceType = await this.prisma.audienceType.findUnique({
      where: { id },
    });

    if (!audienceType) {
      throw new NotFoundException(`AudienceType with ID ${id} not found`);
    }

    await this.prisma.audienceType.delete({ where: { id } });

    return { message: `AudienceType with ID ${id} successfully deleted` };
  }
}
