import { DayOfWeek, WeekType } from '.prisma/client'
import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import {
	BulkScheduleDistanceDto,
	BulkScheduleDto,
} from './dto/bulk-schedule.dto'

export interface BusyMap {
	even: Record<string, { rooms?: string[]; teachers?: string[] }>
	odd: Record<string, { rooms?: string[]; teachers?: string[] }>
}

@Injectable()
export class ScheduleService {
	constructor(private readonly prisma: PrismaService) {}

	/** Сохраняет сразу все пары для одной группы + полугодие */
	async bulkCreate(dto: BulkScheduleDto) {
		const { studyPlanId, groupId, halfYear, schedule } = dto

		// 1) находим все уже существующие пары
		const pairs = await this.prisma.schedulePair.findMany({
			where: { studyPlanId, halfYear },
			select: { id: true },
		})
		const pairIds = pairs.map(p => p.id)

		// 2–5) удаляем связи «пара→группа», «пара→кабинет», «пара→преподаватель» и сами пары
		await this.prisma.schedulePairGroup.deleteMany({
			where: { pairId: { in: pairIds }, groupId },
		})
		await this.prisma.schedulePairRoom.deleteMany({
			where: { pairId: { in: pairIds } },
		})
		await this.prisma.schedulePairTeacher.deleteMany({
			where: { pairId: { in: pairIds } },
		})
		await this.prisma.schedulePair.deleteMany({
			where: { id: { in: pairIds } },
		})

		// 6) создаём новые
		const creations = []

		for (const [weekKey, slots] of Object.entries(schedule) as [
			'even' | 'odd',
			typeof schedule.even,
		][]) {
			const weekType = weekKey.toUpperCase() as WeekType

			for (const [daySlot, data] of Object.entries(slots)) {
				// находим assignment по дисциплине+типу
				const assignment =
					await this.prisma.teacherDisciplineAssignment.findUnique({
						where: {
							discipline_type: {
								discipline: data.disciplineName,
								type: data.type,
							},
						},
					})
				if (!assignment) {
					throw new NotFoundException(
						`Assignment not found for ${data.disciplineName} (${data.type})`
					)
				}

				// нормализуем строку "Понедельник-08:30 — 10:00" → slotId="08:30-10:00"
				const slotId = daySlot
					.split('-', 2)[1]
					.trim()
					.replace(/\s*—\s*/, '-')

				creations.push(
					this.prisma.schedulePair.create({
						data: {
							halfYear,
							weekType,
							dayOfWeek: this.mapDay(daySlot.split('-', 1)[0]),
							timeSlot: {
								connectOrCreate: {
									where: { id: slotId },
									create: {
										id: slotId,
										start: slotId.split('-')[0],
										end: slotId.split('-')[1],
										title: daySlot.split('-', 2)[1].trim(),
									},
								},
							},
							studyPlan: { connect: { id: studyPlanId } },
							assignment: { connect: { id: assignment.id } },
							isOnline: data.isOnline,
							groups: {
								create: { group: { connect: { id: groupId } } },
							},
							rooms: data.roomId && {
								create: { audience: { connect: { id: data.roomId } } },
							},
							teachers: data.teacherIds && {
								create: data.teacherIds.map(tid => ({
									teacher: { connect: { id: tid } },
								})),
							},
						},
					})
				)
			}
		}

		return Promise.all(creations)
	}

	/** Сохраняет расписание для заочной группы */
	async bulkCreateDistance(dto: BulkScheduleDistanceDto) {
		const { studyPlanId, groupId, halfYear, schedule } = dto

		const pairs = await this.prisma.schedulePair.findMany({
			where: { studyPlanId, halfYear },
			select: { id: true },
		})
		const pairIds = pairs.map(p => p.id)

		// 2–5) удаляем связи «пара→группа», «пара→кабинет», «пара→преподаватель» и сами пары
		await this.prisma.schedulePairGroup.deleteMany({
			where: { pairId: { in: pairIds }, groupId },
		})
		await this.prisma.schedulePairRoom.deleteMany({
			where: { pairId: { in: pairIds } },
		})
		await this.prisma.schedulePairTeacher.deleteMany({
			where: { pairId: { in: pairIds } },
		})
		await this.prisma.schedulePair.deleteMany({
			where: { id: { in: pairIds } },
		})

		// 6) создаём новые записи для заочной группы
		const creations = []

		// Перебираем недели (week1, week2, week3, week4)
		for (const [weekKey, slots] of Object.entries(schedule) as [
			'week1' | 'week2' | 'week3' | 'week4',
			typeof schedule.week1,
		][]) {
			const numberWeek = parseInt(weekKey.replace('week', ''), 10) // Номер недели (1, 2, 3, 4)

			for (const [daySlot, data] of Object.entries(slots)) {
				// находим assignment по дисциплине и типу
				const assignment =
					await this.prisma.teacherDisciplineAssignment.findUnique({
						where: {
							discipline_type: {
								discipline: data.disciplineName,
								type: data.type,
							},
						},
					})
				if (!assignment) {
					throw new NotFoundException(
						`Assignment not found for ${data.disciplineName} (${data.type})`
					)
				}

				const slotId = daySlot
					.split('-', 2)[1]
					.trim()
					.replace(/\s*—\s*/, '-')

				creations.push(
					this.prisma.schedulePair.create({
						data: {
							halfYear,
							numberWeek,
							dayOfWeek: this.mapDay(daySlot.split('-', 1)[0]),
							timeSlot: {
								connectOrCreate: {
									where: { id: slotId },
									create: {
										id: slotId,
										start: slotId.split('-')[0],
										end: slotId.split('-')[1],
										title: daySlot.split('-', 2)[1].trim(),
									},
								},
							},
							studyPlan: { connect: { id: studyPlanId } },
							assignment: { connect: { id: assignment.id } },
							isOnline: data.isOnline,
							groups: {
								create: { group: { connect: { id: groupId } } },
							},
							rooms: data.roomId && {
								create: { audience: { connect: { id: data.roomId } } },
							},
							teachers: data.teacherIds && {
								create: data.teacherIds.map(tid => ({
									teacher: { connect: { id: tid } },
								})),
							},
						},
					})
				)
			}
		}

		console.log('Создание пар для заочной группы:', creations)

		return Promise.all(creations)
	}

	async getDistanceSchedule(
		groupId: string,
		studyPlanId: string,
		halfYear: string
	) {
		// Логируем полученные параметры
		console.log('Received parameters:', { groupId, studyPlanId, halfYear })

		// Получаем все пары для заданного studyPlanId, groupId и halfYear через таблицу SchedulePairGroup
		const pairs = await this.prisma.schedulePair.findMany({
			where: {
				studyPlanId, // фильтруем по studyPlanId
				halfYear, // фильтруем по полугодию
				groups: {
					// фильтруем через связь с группами
					some: { groupId }, // ищем группы, которые связаны с данной парой
				},
			},
			include: {
				timeSlot: true,
				groups: { include: { group: true } }, // загружаем группы
				assignment: {
					include: {
						teachers: true, // загружаем преподавателей
					},
				},
				teachers: {
					include: {
						teacher: { include: { user: true } }, // загружаем информацию о преподавателе
					},
				},
				rooms: {
					include: { audience: true }, // загружаем аудитории
				},
			},
		})

		// Логируем полученные пары
		console.log('Fetched pairs:', pairs)

		// Если нет пар, возвращаем пустой объект
		if (!pairs.length) {
			console.log('No pairs found for the provided parameters')
			return { week1: {}, week2: {}, week3: {}, week4: {} }
		}

		// Создаем расписание
		const schedule = {
			week1: {},
			week2: {},
			week3: {},
			week4: {},
		}

		// Заполняем расписание по неделям
		pairs.forEach(pair => {
			const daySlot = `${pair.dayOfWeek}-${pair.timeSlot.title}` // Преобразуем день недели и время
			const weekKey = `week${pair.numberWeek}` // Номер недели (1, 2, 3, 4)

			console.log(`Adding pair to ${weekKey}: ${daySlot}`) // Логируем, какую пару добавляем в расписание

			schedule[weekKey][daySlot] = {
				disciplineName: pair.assignment.discipline, // Название дисциплины
				type: pair.assignment.type, // Тип дисциплины
				isOnline: pair.isOnline, // Статус онлайн
				roomId: pair.rooms[0]?.audience.id, // ID аудитории
				teacherIds: pair.teachers.map(t => t.teacher.id), // Список ID преподавателей
			}
		})

		// Логируем финальное расписание
		console.log('Final schedule:', schedule)

		return schedule
	}

	/** Расписание одной группы за полугодие + неделю */
	async findByGroup(groupId: string, halfYear: string, weekType: WeekType) {
		return this.prisma.schedulePair.findMany({
			where: {
				halfYear,
				weekType,
				groups: { some: { groupId } },
			},
			include: {
				timeSlot: true,
				groups: { include: { group: true } },
				assignment: {
					include: {
						teachers: true,
					},
				},
				teachers: {
					include: {
						teacher: { include: { user: true } },
					},
				},
				rooms: {
					include: { audience: true },
				},
			},
		})
	}

	/** Занятость кабинета: возвращаем карту BusyMap */
	async findBusyRooms(audienceId: string, halfYear: string) {
		return this.prisma.schedulePair.findMany({
			where: { halfYear, rooms: { some: { audienceId } } },
			include: {
				timeSlot: true,
				groups: { include: { group: true } },
				rooms: { include: { audience: true } },
				teachers: {
					include: {
						teacher: {
							include: { user: true },
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
	}

	/** Занятость преподавателя: возвращаем карту BusyMap */
	/** Занятость преподавателя: возвращаем карту BusyMap */
	async findBusyTeachers(teacherId: string, halfYear: string): Promise<any> {
		return this.prisma.schedulePair.findMany({
			where: {
				halfYear,
				teachers: {
					some: { teacherId },
				},
			},
			include: {
				timeSlot: true,
				groups: { include: { group: true } },
				rooms: { include: { audience: true } },
				teachers: {
					include: {
						teacher: {
							include: { user: true },
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
	}

	/** Преобразует русский день недели в enum DayOfWeek */
	private mapDay(str: string): DayOfWeek {
		const map: Record<string, DayOfWeek> = {
			Понедельник: DayOfWeek.MON,
			Monday: DayOfWeek.MON,
			Вторник: DayOfWeek.TUE,
			Tuesday: DayOfWeek.TUE,
			Среда: DayOfWeek.WED,
			Wednesday: DayOfWeek.WED,
			Четверг: DayOfWeek.THU,
			Thursday: DayOfWeek.THU,
			Пятница: DayOfWeek.FRI,
			Friday: DayOfWeek.FRI,
			Суббота: DayOfWeek.SAT,
			Saturday: DayOfWeek.SAT,
			Воскресенье: DayOfWeek.SUN,
			Sunday: DayOfWeek.SUN,
		}
		const d = map[str]
		if (!d) throw new BadRequestException(`Unknown day: ${str}`)
		return d
	}

	/** Группирует список пар по «полугодие → день-слот» */
	private groupBySlot(
		records: { weekType: WeekType; dayOfWeek: DayOfWeek; timeSlotId: string }[]
	): BusyMap {
		const result: BusyMap = { even: {}, odd: {} }
		for (const { weekType, dayOfWeek, timeSlotId } of records) {
			const dayKey = DayOfWeek[dayOfWeek] // например "MON"
			const slotKey = `${dayKey}-${timeSlotId}`
			const w = weekType === WeekType.EVEN ? 'even' : 'odd'
			if (!result[w][slotKey]) result[w][slotKey] = {}
			// помечаем занятость — детализацию rooms/teachers дополняйте в frontende по необходимости
			result[w][slotKey] = {}
		}
		return result
	}
}
