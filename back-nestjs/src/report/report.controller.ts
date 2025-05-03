/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Res } from '@nestjs/common'
import { Response } from 'express' // Не забудьте импортировать Response из express
import { ReportService } from './report.service'

@Controller('report')
export class ReportController {
	constructor(private readonly reportService: ReportService) {}

	@Post('generate')
	async generateReport(
		@Body()
		body: {
			groupIds: string[]
			semester: string
			educationForm: string
		}, // Параметры отчёта
		@Res() res: Response // Ответ для отправки файла
	) {
		const { groupIds, semester, educationForm } = body
		console.log(groupIds, semester, educationForm)

		try {
			// Вызываем сервис для создания отчёта
			const filePath = await this.reportService.generateReport(
				groupIds,
				semester,
				educationForm
			)

			console.log('123', filePath)

			// Отправляем сгенерированный файл пользователю
			return res.sendFile(filePath, err => {
				if (err) {
					return res.status(500).send({ message: 'Ошибка при отправке отчёта' })
				}
			})
		} catch (error) {
			return res.status(500).send({ message: 'Ошибка при создании отчёта' })
		}
	}
}
