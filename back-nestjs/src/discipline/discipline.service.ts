/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { TeacherDisciplineAssignmentDto } from './diciplne.dto'

@Injectable()
export class DisciplineService {
	constructor(private prisma: PrismaService) {}

	async getDisciplinesByStudyPlan(studyPlanId: string) {
		const studyPlan = await this.prisma.studyPlan.findUnique({
			where: { id: studyPlanId },
			include: { disciplines: true },
		})

		if (!studyPlan) {
			throw new NotFoundException(`Учебный план с id ${studyPlanId} не найден`)
		}

		return studyPlan.disciplines
	}

	async getTeacherPairs(teacherId: string) {
		try {
			const assignments =
				await this.prisma.teacherDisciplineAssignment.findMany({
					where: {
						teachers: {
							some: {
								id: teacherId,
							},
						},
					},
					select: {
						id: true,
						discipline: true,
						type: true,
						audienceType: {
							select: {
								id: true,
								title: true,
							},
						},
					},
				})

			if (!assignments || assignments.length === 0) {
				throw new NotFoundException(
					`Пары для преподавателя с id ${teacherId} не найдены`
				)
			}

			return assignments
		} catch (error) {
			throw new Error(
				`Не удалось получить пары для преподавателя с id: ${teacherId}`
			)
		}
	}

	async getTeacherTextWish(teacherId: string) {
		try {
			// Ищем текстовое пожелание для преподавателя по его ID
			const textWish = await this.prisma.textWish.findUnique({
				where: {
					teacherId: teacherId, // По ID преподавателя
				},
				select: {
					wishText: true, // Выбираем только текст пожелания
				},
			})

			if (!textWish) {
				throw new NotFoundException(
					`Текстовое пожелание для преподавателя с id ${teacherId} не найдено`
				)
			}

			return textWish.wishText // Возвращаем текст пожелания
		} catch (error) {
			throw new Error(
				`Не удалось получить текстовое пожелание для преподавателя с id: ${teacherId}`
			)
		}
	}

	async savePreferences(
		teacherId: string,
		preferences: { audienceTypes: any[]; wishText: string }
	) {
		try {
			const { audienceTypes, wishText } = preferences
			// console.log(audienceTypes, wishText)

			for (const assignment of audienceTypes) {
				const existingAssignment =
					await this.prisma.teacherDisciplineAssignment.findFirst({
						where: {
							teachers: {
								some: {
									id: teacherId,
								},
							},
							id: assignment.id,
						},
					})

				if (existingAssignment) {
					await this.prisma.teacherDisciplineAssignment.update({
						where: { id: existingAssignment.id },
						data: {
							audienceTypeId: assignment.audienceTypeId as string,
						},
					})
				}
			}

			await this.prisma.textWish.upsert({
				where: { teacherId: teacherId },
				update: { wishText: wishText },
				create: {
					teacher: { connect: { id: teacherId } },
					wishText: wishText,
				},
			})
		} catch (error) {
			throw new NotFoundException(
				`Ошибка при сохранении предпочтений для преподавателя с id ${teacherId}: ${error.message}`
			)
		}
	}

	// async getCommonDisciplinesByGroupsAndSemester(
	// 	groupIds: string[],
	// 	semester: number
	// ) {
	// 	if (groupIds.length < 2) {
	// 		throw new Error('Необходимо выбрать как минимум две группы')
	// 	}

	// 	// Получаем группы с учебными планами
	// 	const groups = await this.prisma.group.findMany({
	// 		where: { id: { in: groupIds } },
	// 		select: { id: true, studyPlanId: true },
	// 	})

	// 	if (groups.some(g => !g.studyPlanId)) {
	// 		throw new NotFoundException(
	// 			'У одной или нескольких групп отсутствует учебный план'
	// 		)
	// 	}

	// 	const studyPlanIds = [...new Set(groups.map(g => g.studyPlanId!))]

	// 	// Получаем дисциплины напрямую из таблицы Discipline для заданных учебных планов и семестра
	// 	const disciplines = await this.prisma.discipline.findMany({
	// 		where: {
	// 			studyPlanId: { in: studyPlanIds },
	// 			semester: semester,
	// 		},
	// 	})

	// 	// Группируем дисциплины по studyPlanId
	// 	const disciplinesByPlan: Record<string, any[]> = {}
	// 	for (const spId of studyPlanIds) {
	// 		disciplinesByPlan[spId] = disciplines.filter(d => d.studyPlanId === spId)
	// 	}

	// 	// Для каждого учебного плана создаем наборы названий дисциплин для лекций и практик
	// 	const lectureSets = studyPlanIds.map(spId => {
	// 		const set = new Set<string>()
	// 		for (const d of disciplinesByPlan[spId]) {
	// 			if (d.lecture_hours != null || d.el_lecture_hours != null) {
	// 				set.add(d.name)
	// 			}
	// 		}
	// 		return set
	// 	})

	// 	const practiceSets = studyPlanIds.map(spId => {
	// 		const set = new Set<string>()
	// 		for (const d of disciplinesByPlan[spId]) {
	// 			if (
	// 				d.practice_hours != null ||
	// 				d.laboratory_hours != null ||
	// 				d.el_practice_hours != null ||
	// 				d.el_laboratory_hours != null
	// 			) {
	// 				set.add(d.name)
	// 			}
	// 		}
	// 		return set
	// 	})

	// 	// Вычисляем пересечение всех наборов для лекционных дисциплин
	// 	const commonLectureNames = lectureSets.reduce((acc, set) => {
	// 		return new Set([...acc].filter(name => set.has(name)))
	// 	})

	// 	// Аналогично для практических дисциплин
	// 	const commonPracticeNames = practiceSets.reduce((acc, set) => {
	// 		return new Set([...acc].filter(name => set.has(name)))
	// 	})

	// 	// Функция генерации id для новых объектов (можно заменить на другой генератор)
	// 	const generateId = () => Math.random().toString(36).substring(2, 10)

	// 	// Формируем итоговый результат: для каждой общей лекционной дисциплины создаем объект с type "lecture",
	// 	// а для практической – объект с type "practice"
	// 	const result = [
	// 		...Array.from(commonLectureNames).map(name => ({
	// 			id: generateId(),
	// 			title: name,
	// 			type: 'lecture',
	// 		})),
	// 		...Array.from(commonPracticeNames).map(name => ({
	// 			id: generateId(),
	// 			title: name,
	// 			type: 'practice',
	// 		})),
	// 	]

	// 	return result
	// }

	async getCommonDisciplinesByGroupsAndSemester(
		groupIds: string[],
		semester: number
	) {
		if (groupIds.length < 2) {
			throw new Error('Необходимо выбрать как минимум две группы')
		}

		// -- Ваша старая логика получения «пересечения» --
		const groups = await this.prisma.group.findMany({
			where: { id: { in: groupIds } },
			select: { id: true, studyPlanId: true },
		})

		if (groups.some(g => !g.studyPlanId)) {
			throw new NotFoundException(
				'У одной или нескольких групп отсутствует учебный план'
			)
		}

		const studyPlanIds = [...new Set(groups.map(g => g.studyPlanId!))]
		const disciplines = await this.prisma.discipline.findMany({
			where: {
				studyPlanId: { in: studyPlanIds },
				semester: semester,
			},
		})

		const disciplinesByPlan: Record<string, any[]> = {}
		for (const spId of studyPlanIds) {
			disciplinesByPlan[spId] = disciplines.filter(d => d.studyPlanId === spId)
		}

		const lectureSets = studyPlanIds.map(spId => {
			const set = new Set<string>()
			for (const d of disciplinesByPlan[spId]) {
				if (d.lecture_hours != null || d.el_lecture_hours != null) {
					set.add(d.name)
				}
			}
			return set
		})

		const practiceSets = studyPlanIds.map(spId => {
			const set = new Set<string>()
			for (const d of disciplinesByPlan[spId]) {
				if (
					d.practice_hours != null ||
					d.laboratory_hours != null ||
					d.el_practice_hours != null ||
					d.el_laboratory_hours != null
				) {
					set.add(d.name)
				}
			}
			return set
		})

		const commonLectureNames = lectureSets.reduce((acc, set) => {
			return new Set([...acc].filter(name => set.has(name)))
		})

		const commonPracticeNames = practiceSets.reduce((acc, set) => {
			return new Set([...acc].filter(name => set.has(name)))
		})

		// Тут мы формируем промежуточный результат (то, что раньше возвращалось «временно»)
		const generateId = () => Math.random().toString(36).substring(2, 10)

		// Пока без связей и без реальных ID
		const tempResult = [
			...Array.from(commonLectureNames).map(name => ({
				id: generateId(), // временный
				title: name,
				type: 'lecture',
				groups: [], // потом заполним из БД
			})),
			...Array.from(commonPracticeNames).map(name => ({
				id: generateId(),
				title: name,
				type: 'practice',
				groups: [],
			})),
		]

		// -- Дальше ищем, нет ли уже в БД таких дисциплин в DisciplineGroupAssignment --
		// Собираем все названия дисциплин, которые «общие»
		const allNames = tempResult.map(d => d.title)

		// Находим реальные записи, если они созданы
		const existingAssignments =
			await this.prisma.disciplineGroupAssignment.findMany({
				where: {
					semester,
					discipline: { in: allNames },
					// Если хочется пометить «объединена» только когда
					// дисциплина назначена *всем* выбранным группам, тогда
					// нужно чуть сложнее проверять. Чаще берут условие:
					// "хотя бы одна выбранная группа уже привязана".
					groups: {
						some: {
							id: { in: groupIds },
						},
					},
				},
				include: { groups: true },
			})

		// Создаём быстрый словарь: discipline -> найденная запись
		const mapByName = new Map<string, (typeof existingAssignments)[number]>()
		for (const asg of existingAssignments) {
			mapByName.set(asg.discipline, asg)
		}

		// Теперь в нашем tempResult, если нашли соответствие в БД —
		// подставляем реальный id и массив groups
		for (const item of tempResult) {
			const found = mapByName.get(item.title)
			if (found) {
				item.id = found.id // реальный id из БД
				item.groups = found.groups
			}
		}

		return tempResult
	}

	async sendSelectedDisciplines(
		selectedDisciplineIds: string[],
		semester: number,
		groupIds: string[]
	) {
		// console.log(groupIds)

		// console.log(selectedDisciplineIds)
		// console.log(groupIds)
		if (selectedDisciplineIds.length < 1 || groupIds.length < 1) {
			throw new Error(
				'Необходимо выбрать хотя бы одну дисциплину и хотя бы одну группу'
			)
		}

		// console.log(groupIds)

		// Получаем группы по переданным id
		const groups = await this.prisma.group.findMany({
			where: { id: { in: groupIds } },
			select: { id: true },
		})

		// console.log('Переданные groupIds:', groupIds)
		// console.log(
		// 	'Найденные группы:',
		// 	groups.map(g => g.id)
		// )

		if (groups.length !== groupIds.length) {
			throw new NotFoundException('Некоторые из выбранных групп не найдены')
		}

		const results = []
		for (const id of selectedDisciplineIds) {
			// Находим запись DisciplineGroupAssignment по id
			const record = await this.prisma.disciplineGroupAssignment.findUnique({
				where: { id },
				include: { groups: true },
			})
			if (record) {
				// Обновляем связь groups, полностью заменяя старый список на новый
				const updated = await this.prisma.disciplineGroupAssignment.update({
					where: { id },
					data: {
						groups: {
							set: groups.map(g => ({ id: g.id })),
						},
					},
					include: { groups: true },
				})
				results.push(updated)
			}
		}
		return { message: 'Дисциплины успешно обновлены', data: results }
	}

	// Новый метод для получения дисциплин в требуемом формате
	async getFormattedDisciplines(
		groupIds?: string[], // необязательный список ID учебных групп
		semester?: number // необязательный параметр семестра
	) {
		// Вспомогательная функция для генерации id (для новых записей)
		const generateId = () => Math.random().toString(36).substring(2, 10)

		// Формируем фильтр для запроса дисциплин
		let whereFilter = {}
		if (groupIds && groupIds.length > 0) {
			// Получаем группы для извлечения studyPlanId
			const groups = await this.prisma.group.findMany({
				where: { id: { in: groupIds } },
				select: { studyPlanId: true },
			})
			// Фильтруем по studyPlanId
			const studyPlanIds = [
				...new Set(groups.map(g => g.studyPlanId).filter(Boolean)),
			]
			// Если задан семестр, добавляем его в фильтр
			if (semester) {
				whereFilter = { studyPlanId: { in: studyPlanIds }, semester: semester }
			} else {
				whereFilter = { studyPlanId: { in: studyPlanIds } }
			}
		} else if (semester) {
			whereFilter = { semester: semester }
		}

		// Извлекаем дисциплины из базы, выбираем только название (name)
		const disciplines = await this.prisma.discipline.findMany({
			where: whereFilter,
			select: { name: true },
		})

		// Получаем уникальные названия дисциплин
		const uniqueTitles = Array.from(new Set(disciplines.map(d => d.name)))

		// Для каждого уникального названия создаём два объекта: lecture и practice.
		// Если для конкретного сочетания (discipline + type) есть запись в TeacherDisciplineAssignment,
		// возвращаем её id и назначенные преподаватели, иначе генерируем новый id и пустой массив.
		const formattedPromises = uniqueTitles.flatMap(title =>
			['lecture', 'practice'].map(async type => {
				const assignment =
					await this.prisma.teacherDisciplineAssignment.findUnique({
						// Используем compound unique key, заданный в схеме с именем "discipline_type"
						where: {
							discipline_type: {
								discipline: title,
								type: type,
							},
						},
						select: { id: true, teachers: { select: { id: true } } },
					})
				if (assignment) {
					return {
						id: assignment.id,
						title,
						type,
						teachers: assignment.teachers.map(t => t.id),
					}
				} else {
					return {
						id: generateId(),
						title,
						type,
						teachers: [],
					}
				}
			})
		)

		const formatted = await Promise.all(formattedPromises)
		return formatted
	}

	async assignTeachers(assignments: TeacherDisciplineAssignmentDto[]) {
		const results = []
		for (const assignment of assignments) {
			const result = await this.prisma.teacherDisciplineAssignment.upsert({
				where: {
					discipline_type: {
						discipline: assignment.discipline,
						type: assignment.type,
					},
				},
				update: {
					teachers: {
						// Полностью заменяем связи на новый список
						set: assignment.teachers.map(id => ({ id })),
					},
				},
				create: {
					discipline: assignment.discipline,
					type: assignment.type,
					teachers: {
						connect: assignment.teachers.map(id => ({ id })),
					},
				},
				include: { teachers: true },
			})
			results.push(result)
		}
		return results
	}

	async getAllTeacherPairs() {
		try {
			const assignments =
				await this.prisma.teacherDisciplineAssignment.findMany({
					select: {
						id: true,
						discipline: true,
						type: true,
						audienceType: {
							select: {
								id: true,
								title: true,
							},
						},
						teachers: {
							select: {
								id: true,
								user: {
									select: {
										firstName: true,
										lastName: true,
										middleName: true,
									},
								},
							},
						},
					},
				})

			if (!assignments || assignments.length === 0) {
				throw new NotFoundException(`Пары не найдены`)
			}

			return assignments
		} catch (error) {
			throw new Error(`Не удалось получить пары: ${error.message}`)
		}
	}

	async getAllTeacherTextWishes() {
		try {
			const textWishes = await this.prisma.textWish.findMany({
				select: {
					teacherId: true,
					wishText: true,
				},
			})

			if (!textWishes || textWishes.length === 0) {
				throw new NotFoundException(`Текстовые пожелания не найдены`)
			}

			return textWishes
		} catch (error) {
			throw new Error(
				`Не удалось получить текстовые пожелания: ${error.message}`
			)
		}
	}
}
