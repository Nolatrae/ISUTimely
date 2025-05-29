import { PrismaService } from '@/prisma.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { DayOfWeek } from '@prisma/client'
import * as dayjs from 'dayjs'

const HOLIDAY_ASSIGNMENT_ID = 'cmb0arlrb003fsecxlzzaholiday' // id записи TeacherDisciplineAssignment: discipline="Праздник", type="holiday"
const HOLIDAY_STUDYPLAN_ID = 'cmb0aapcz0002secxky779s00' // id учебного плана для праздников

@Injectable()
export class HolidayService {
	constructor(private prisma: PrismaService) {}

	async createHoliday(dto: any) {
		const { date, name, roomId, timeSlots } = dto

		// 1. Найти academicWeek, в которую попадает дата
		const dateObj = dayjs(date).toDate()
		const academicWeek = await this.prisma.academicWeek.findFirst({
			where: {
				startDate: { lte: dateObj },
				endDate: { gte: dateObj },
			},
		})
		if (!academicWeek) {
			throw new NotFoundException('Не найдена академическая неделя для даты')
		}

		// 2. Определить день недели (MON, TUE...)
		const jsDay = dayjs(date).day() // 0=вс, 1=пн...
		const weekDays: DayOfWeek[] = [
			'SUN',
			'MON',
			'TUE',
			'WED',
			'THU',
			'FRI',
			'SAT',
		]
		const dayOfWeek: DayOfWeek = weekDays[jsDay]

		// 3. Для каждого таймслота создать SchedulePair
		const pairs = await Promise.all(
			timeSlots.map(async (slot: string) => {
				const slotId = slot.replace(/\s*—\s*/, '-')
				return this.prisma.schedulePair.create({
					data: {
						academicWeek: { connect: { id: academicWeek.id } },
						dayOfWeek,
						timeSlot: {
							connectOrCreate: {
								where: { id: slotId },
								create: {
									id: slotId,
									start: slotId.split('-')[0],
									end: slotId.split('-')[1],
									title: slot,
								},
							},
						},
						studyPlan: { connect: { id: HOLIDAY_STUDYPLAN_ID } },
						assignment: { connect: { id: HOLIDAY_ASSIGNMENT_ID } },
						isHoliday: true,
						holidayName: name,
						rooms: roomId
							? {
									create: { audience: { connect: { id: roomId } } },
								}
							: undefined,
					},
				})
			})
		)
		return pairs
	}
	0
	/**
	 * Создаёт постоянный (еженедельный) праздник:
	 * начиная с startDate и до endDate включительно,
	 * каждую неделю в тот же день недели, что и startDate.
	 */
	async createRecurringHoliday(dto: {
		startDate: string
		endDate: string
		name: string
		roomId?: string
		timeSlots: string[]
	}): Promise<any[]> {
		const { startDate, endDate, name, roomId, timeSlots } = dto

		// Парсим ISO-строки в Date
		const start = new Date(startDate)
		const finish = new Date(endDate)

		// Собираем все SchedulePair в один плоский массив
		const allPairs: any[] = []

		// Делать шаг +7 дней, пока current <= finish
		for (
			let current = new Date(start);
			current <= finish;
			current.setDate(current.getDate() + 7)
		) {
			// вызываем вашу логику разового создания
			const pairs = await this.createHoliday({
				date: current.toISOString(),
				name,
				roomId,
				timeSlots,
			})
			allPairs.push(...pairs)
		}

		return allPairs
	}

	async getAllHolidays() {
		return this.prisma.schedulePair.findMany({
			where: { isHoliday: true },
			include: {
				academicWeek: true,
				timeSlot: true,
				rooms: { include: { audience: true } },
			},
			orderBy: [
				{ academicWeek: { startDate: 'asc' } },
				{ dayOfWeek: 'asc' },
				{ timeSlot: { start: 'asc' } },
			],
		})
	}
}
