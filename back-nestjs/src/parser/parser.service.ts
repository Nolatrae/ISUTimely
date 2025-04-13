/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import { PrismaService } from 'src/prisma.service'
import * as XLSX from 'xlsx'

import { UploadService } from './upload.service'
import { extractWeek } from './utils/createSemesterWeeks'
import { extractDataFromFirstSheet } from './utils/extractDataFromFirstSheet'
import { extractDisciplines } from './utils/extractDisciplines'

@Injectable()
export class ParserService {
	constructor(
		private prisma: PrismaService,
		private uploadService: UploadService
	) {}

	async parseStudyPlan(fileId: string, dto: any) {
		// 1️⃣ Получаем путь к файлу по `id`
		const filePath = await this.uploadService.getFilePath(fileId)

		// 2️⃣ Проверяем, существует ли файл
		if (!fs.existsSync(filePath)) {
			throw new Error('Файл не найден на сервере')
		}

		// 3️⃣ Читаем Excel-файл
		const workbook = XLSX.readFile(filePath)
		const data = extractDataFromFirstSheet(workbook)

		// 4️⃣ Создаём учебный план, связывая его с существующими группами,
		// переданными из клиента в dto.groups
		const studyPlan = await this.prisma.studyPlan.create({
			data: {
				title: dto.title,
				groups: {
					connect: dto.groups.map((id: string) => ({ id })),
				},
			},
		})

		// 4.1️⃣ Дополняем существующие группы новыми данными, извлечёнными из файла
		await Promise.all(
			dto.groups.map((groupId: string) =>
				this.prisma.group.update({
					where: { id: groupId },
					data: {
						// Обновляем поля группы новыми данными из файла
						code: data.code,
						countStudents: '30',
						direction: data.profile,
						formEducation: data.formEducation,
						durationPeriod: 4,
						yearEnrollment: new Date(data.yearEnrollment),
					},
				})
			)
		)

		// 5️⃣ Запускаем разбор семестров
		await this.parsingSemesters(filePath, studyPlan.id, dto)

		return studyPlan
	}

	private async createDisciplinesForSemester(
		disciplines: any[],
		semester: string,
		studyPlanId: string
	) {
		const disciplineData = disciplines.map(discipline => ({
			name: discipline.name,
			semester: parseInt(semester, 10),
			lecture_hours: discipline.lecture_hours ?? undefined,
			el_lecture_hours: discipline.el_lecture_hours ?? undefined,
			laboratory_hours: discipline.laboratory_hours ?? undefined,
			el_laboratory_hours: discipline.el_laboratory_hours ?? undefined,
			practice_hours: discipline.practice_hours ?? undefined,
			el_practice_hours: discipline.el_practice_hours ?? undefined,
			control: discipline.control ?? undefined,
			studyPlan: {
				connect: { id: studyPlanId },
			},
		}))

		return await this.prisma.$transaction(
			disciplineData.map(data => this.prisma.discipline.create({ data }))
		)
	}

	private async parsingSemesters(
		filePath: string,
		studyPlanId: string,
		dto: any
	) {
		const workbook = XLSX.readFile(filePath)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { results, countWeeks } = extractDisciplines(
			workbook,
			dto.start_1,
			dto.end_1,
			dto.start_2,
			dto.end_2,
			dto.start_3,
			dto.end_3,
			dto.start_4,
			dto.end_4
		)

		await this.prisma.semesterWeek.create({
			data: {
				studyPlan: { connect: { id: studyPlanId } },
				week_1: extractWeek(countWeeks[0]),
				week_2: extractWeek(countWeeks[1]),
				week_3: extractWeek(countWeeks[2]),
				week_4: extractWeek(countWeeks[3]),
				week_5: extractWeek(countWeeks[4]),
				week_6: extractWeek(countWeeks[5]),
				week_7: extractWeek(countWeeks[6]),
				week_8: extractWeek(countWeeks[7]),
			},
		})

		// 3️⃣ Создаём дисциплины
		const createdDisciplines = []
		for (const semester in results) {
			const disciplines = results[semester]
			const createdSemesterDisciplines =
				await this.createDisciplinesForSemester(
					disciplines,
					semester,
					studyPlanId
				)
			createdDisciplines.push(...createdSemesterDisciplines)
		}

		return 'Парсинг завершён'
	}
}
