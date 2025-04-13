/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';

const prisma = new PrismaClient();

@Injectable()
export class UploadService {
  getStorageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename =
            file.fieldname + '-' + uniqueSuffix + extname(file.originalname);
          cb(null, filename);
        },
      }),
    };
  }

  async saveFileInfo(filename: string, path: string) {
    return await prisma.uploadedFiles.create({
      data: {
        filename,
        path,
      },
    });
  }

  async getAllFiles() {
    return await prisma.uploadedFiles.findMany();
  }
}
