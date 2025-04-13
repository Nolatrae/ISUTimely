/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('excel')
  @UseInterceptors(
    FileInterceptor('file', new UploadService().getStorageConfig()),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const filePath = `uploads/${file.filename}`;

    // Сохраняем информацию о файле в БД
    const savedFile = await this.uploadService.saveFileInfo(
      file.filename,
      filePath,
    );

    return { message: 'Файл загружен', file: savedFile };
  }

  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(__dirname, '..', '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Файл не найден');
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.sendFile(filePath);
  }

  @Get()
  async getAllFiles() {
    return await this.uploadService.getAllFiles();
  }
}
