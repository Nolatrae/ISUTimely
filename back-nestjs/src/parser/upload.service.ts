/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  async saveFilePath(filename: string) {
    return await this.prisma.uploadedFiles.create({
      data: {
        filename,
        path: `uploads/${filename}`,
      },
    });
  }

  async getFilePath(fileId: string) {
    const file = await this.prisma.uploadedFiles.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('Файл не найден');
    }

    return file.path;
  }

  // ✅ Добавляем метод, который ищет файл по `id`
  async getFileById(fileId: string) {
    return await this.prisma.uploadedFiles.findUnique({
      where: { id: fileId },
    });
  }

  async listFiles() {
    return await this.prisma.uploadedFiles.findMany();
  }
}
