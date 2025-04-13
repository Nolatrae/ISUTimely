/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AudienceDto, UpdateAudienceDto } from './audience.dto';

@Injectable()
export class AudienceService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const audience = await this.prisma.audience.findUnique({
      where: { id },
      include: {
        equipment: {
          select: { equipment: true }, // Загружаем только `equipment`, но всё равно остаётся вложенность
        },
      },
    });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    // Разворачиваем `equipment` в плоский массив
    return {
      ...audience,
      equipment: audience.equipment.map((e) => e.equipment),
    };
  }

  async getAll() {
    const audiences = await this.prisma.audience.findMany({
      include: {
        equipment: {
          select: { equipment: true },
        },
      },
    });

    // Разворачиваем `equipment` в каждом `audience`
    return audiences.map((audience) => ({
      ...audience,
      equipment: audience.equipment.map((e) => e.equipment),
    }));
  }

  async create(data: AudienceDto) {
    // Проверяем, существует ли аудитория с таким же названием
    const existingAudience = await this.prisma.audience.findFirst({
      where: { title: data.title },
    });

    if (existingAudience) {
      throw new ConflictException(
        `Audience with title '${data.title}' already exists`,
      );
    }

    // Транзакция: создаём аудиторию и связываем оборудование
    return await this.prisma.$transaction(async (tx) => {
      const audience = await tx.audience.create({
        data: {
          title: data.title,
          audienceTypeId: data.audienceTypeId,
          buildingId: data.buildingId,
          capacity: data.capacity,
          additionalInfo: data.additionalInfo,
        },
        include: {
          equipment: { select: { equipment: true } }, // Теперь `equipment` включается в ответ
        },
      });

      if (data.equipmentIds?.length) {
        await tx.audienceEquipment.createMany({
          data: data.equipmentIds.map((equipmentId) => ({
            audienceId: audience.id,
            equipmentId,
          })),
        });
      }

      return audience;
    });
  }

  async update(id: string, data: UpdateAudienceDto) {
    const audience = await this.prisma.audience.findUnique({ where: { id } });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    // Транзакция: обновляем аудиторию и оборудование
    return await this.prisma.$transaction(async (tx) => {
      const updatedAudience = await tx.audience.update({
        where: { id },
        data: {
          title: data.title ?? audience.title,
          audienceTypeId: data.audienceTypeId ?? audience.audienceTypeId,
          buildingId: data.buildingId ?? audience.buildingId,
          capacity: data.capacity ?? audience.capacity,
          additionalInfo: data.additionalInfo ?? audience.additionalInfo,
        },
        include: {
          equipment: { select: { equipment: true } }, // Теперь `equipment` включается в ответ
        },
      });

      if (data.equipmentIds) {
        await tx.audienceEquipment.deleteMany({ where: { audienceId: id } });

        await tx.audienceEquipment.createMany({
          data: data.equipmentIds.map((equipmentId) => ({
            audienceId: id,
            equipmentId,
          })),
        });
      }

      return updatedAudience;
    });
  }

  async delete(id: string): Promise<{ message: string }> {
    const audience = await this.prisma.audience.findUnique({ where: { id } });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    // Транзакция: сначала удаляем связи, затем саму аудиторию
    await this.prisma.$transaction(async (tx) => {
      await tx.audienceEquipment.deleteMany({ where: { audienceId: id } });
      await tx.audience.delete({ where: { id } });
    });

    return { message: `Audience with ID ${id} successfully deleted` };
  }
}
