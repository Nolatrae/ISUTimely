/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import { exec } from 'child_process'
import { PrismaService } from 'src/prisma.service'

@Injectable()
export class ReportService {
	constructor(private prisma: PrismaService) {}

	async generateReport(
		selectedGroupIds: string[],
		semester: string,
		educationForm: string
	) {
		try {
			console.log('Starting to fetch data from DB...')

			// Запрашиваем данные на основе выбранных групп и других параметров
			const result = await this.prisma.schedulePair.findMany({
				where: {
					halfYear: semester,
					groups: {
						some: {
							groupId: { in: selectedGroupIds },
						},
					},
				},
				include: {
					timeSlot: true,
					groups: { include: { group: true } },
					rooms: { include: { audience: true } },
					teachers: {
						include: {
							teacher: {
								include: { user: true, position: true, department: true },
							},
						},
					},
					assignment: {
						include: {
							teachers: { include: { user: true } },
						},
					},
				},
			})

			console.log('Data fetched successfully:')

			// Подготовка параметров для передачи в Python
			const reportData = JSON.stringify({
				selectedGroupIds,
				semester,
				educationForm,
				schedule: result,
			})

			// Путь к Python-скрипту
			const pythonScriptPath =
				'E:/INTACT/ISUTimely/back-nestjs/src/report/generate_report.py'
			const command = `python3 ${pythonScriptPath} '${reportData}'` // Передаем данные как строку

			console.log('Running Python script with command:')

			return new Promise<string>((resolve, reject) => {
				exec(command, (error, stdout, stderr) => {
					console.log('wow')
					if (error) {
						console.error(`Error executing Python script: ${stderr}`)
						return reject('Ошибка при генерации отчёта')
					}

					console.log('Python script executed successfully')
					console.log('stdout:', stdout) // Вывод stdout
					console.error('stderr:', stderr) // Вывод stderr

					const reportFilePath =
						'E:/INTACT/ISUTimely/back-nestjs/src/report/generated_report.pdf'
					resolve(reportFilePath)
				})
			})
		} catch (error) {
			console.error('Error in generateReport method:', error)
			throw error
		}
	}
}
