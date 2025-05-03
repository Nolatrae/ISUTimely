/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { TeacherDisciplineAssignmentDto } from './diciplne.dto'
import { DisciplineService } from './discipline.service'

@Controller('disciplines')
export class DisciplineController {
	constructor(private readonly disciplineService: DisciplineService) {}

	@Get(':studyPlanId')
	async getDisciplines(@Param('studyPlanId') studyPlanId: string) {
		return this.disciplineService.getDisciplinesByStudyPlan(studyPlanId)
	}

	@Post('common')
	async getCommonDisciplines(
		@Body() body: { groupIds: string[]; semester: number }
	) {
		const { groupIds, semester } = body

		if (!groupIds || groupIds.length < 2 || typeof semester !== 'number') {
			return {
				message:
					'В теле запроса должны быть минимум 2 groupIds и корректный номер семестра',
			}
		}

		return this.disciplineService.getCommonDisciplinesByGroupsAndSemester(
			groupIds,
			semester
		)
	}

	// Новый POST метод для отправки выбранных дисциплин
	@Post('assign')
	async sendSelectedDisciplines(
		@Body()
		body: {
			groupIds: string[] // ID выбранных групп
			semester: number // Семестр
			disciplines: string[] // Названия выбранных дисциплин
		}
	) {
		const { groupIds, semester, disciplines } = body
		// console.log(disciplines)

		if (
			!groupIds ||
			groupIds.length < 1 ||
			!disciplines ||
			disciplines.length < 1
		) {
			return {
				message: 'Необходимо выбрать хотя бы одну группу и одну дисциплину',
			}
		}

		// Отправляем дисциплины на сервер
		try {
			const result = await this.disciplineService.sendSelectedDisciplines(
				disciplines,
				semester,
				groupIds
			)
			return result
		} catch (error) {
			return { message: 'Ошибка при отправке данных: ' + error.message }
		}
	}

	// Новый метод для получения форматированных дисциплин
	@Post('formatted')
	async getFormattedDisciplines(
		@Body() body: { groupIds?: string[]; semester?: number }
	) {
		const { groupIds, semester } = body
		return this.disciplineService.getFormattedDisciplines(groupIds, semester)
	}

	@Post('assign-teachers')
	async assignTeachers(
		@Body() body: { assignments: TeacherDisciplineAssignmentDto[] }
	) {
		return this.disciplineService.assignTeachers(body.assignments)
	}

	// Новый метод для получения пар преподавателя по его ID
	@Post('teacher/:teacherId/pairs')
	async getTeacherPairs(@Param('teacherId') teacherId: string) {
		try {
			const pairs = await this.disciplineService.getTeacherPairs(teacherId)
			return pairs
		} catch (error) {
			return {
				message: 'Ошибка при получении пар преподавателя: ' + error.message,
			}
		}
	}

	@Post('teacher/:teacherId/text')
	async getTeacherTextWish(@Param('teacherId') teacherId: string) {
		try {
			const pairs = await this.disciplineService.getTeacherTextWish(teacherId)
			return pairs
		} catch (error) {
			return {
				message: 'Ошибка при получении текста преподавателя: ' + error.message,
			}
		}
	}

	// Получение всех пар всех преподавателей
	@Get('all/pairs')
	async getAllTeacherPairs() {
		try {
			const pairs = await this.disciplineService.getAllTeacherPairs()
			// console.log(pairs)
			return pairs
		} catch (error) {
			return {
				message: 'Ошибка при получении всех пар: ' + error.message,
			}
		}
	}

	// Получение всех текстовых пожеланий преподавателей
	@Get('all/texts')
	async getAllTeacherTextWishes() {
		try {
			const wishes = await this.disciplineService.getAllTeacherTextWishes()
			return wishes
		} catch (error) {
			return {
				message:
					'Ошибка при получении текстов преподавателей: ' + error.message,
			}
		}
	}

	@Post(':teacherId/preferences')
	async saveTeacherPreferences(
		@Param('teacherId') teacherId: string,
		@Body() preferences: { audienceTypes: any[]; wishText: string }
	) {
		try {
			// Передаём данные в сервис для сохранения
			await this.disciplineService.savePreferences(teacherId, preferences)
			return { message: 'Пожелания сохранены успешно!' }
		} catch (error) {
			return {
				message: 'Ошибка при сохранении предпочтений: ' + error.message,
			}
		}
	}
}
