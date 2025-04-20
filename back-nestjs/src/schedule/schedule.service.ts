import { DayOfWeek, WeekType } from '.prisma/client'
import { PrismaService } from '@/prisma.service'
import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { BulkScheduleDto } from './dto/bulk-schedule.dto'

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
	async findBusyTeachers(
		teacherId: string,
		halfYear: string
	): Promise<BusyMap> {
		const raw = await this.prisma.schedulePairTeacher.findMany({
			where: { teacherId, pair: { halfYear } },
			select: {
				pair: {
					select: { weekType: true, dayOfWeek: true, timeSlotId: true },
				},
			},
		})
		return this.groupBySlot(raw.map(r => r.pair))
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
