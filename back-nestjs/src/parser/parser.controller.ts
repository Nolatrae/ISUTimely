/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express'; // ❗ Импортируем Response
import * as fs from 'fs'; // ❗ Импортируем fs
import { diskStorage } from 'multer';
import * as path from 'path'; // ❗ Импортируем path
import { extname } from 'path';
import { ParserService } from './parser.service';
import { UploadService } from './upload.service';

@Controller('parser')
export class ParserController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly parserService: ParserService,
  ) {}

  // 1️⃣ Метод: Загружает файл и сохраняет его путь в БД
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // ✅ Корректный путь
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
          );
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const uploadedFile = await this.uploadService.saveFilePath(file.filename);
    return { message: 'Файл успешно загружен', file: uploadedFile };
  }

  // 2️⃣ Метод: Запускает парсинг по `id` файла
  @Post('parse/:fileId')
  async parseFile(@Param('fileId') fileId: string, @Body() body: any) {
    const parsedData = await this.parserService.parseStudyPlan(fileId, body);
    return { message: 'Файл успешно обработан', data: parsedData };
  }

  // 3️⃣ Метод: Получение пути к файлу по `id`
  @Get(':fileId')
  async getFileById(@Param('fileId') fileId: string) {
    const file = await this.uploadService.getFileById(fileId);
    if (!file) {
      return { error: 'Файл не найден' };
    }
    return {
      fileUrl: `http://localhost:4200/api/parser/file/${file.filename}`, // ✅ Исправленный URL
    };
  }

  // 4️⃣ Метод: Раздача файла для `iframe`
  @Get('file/:filename')
  getUploadedFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(__dirname, '../../uploads', filename);

    // ✅ Проверяем, существует ли файл
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'inline'); // ✅ Открываем в браузере

    return res.sendFile(filePath);
  }
}
