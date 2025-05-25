import { instance } from '@/api/axios'

export type WeekType = 'EVEN' | 'ODD'

export interface ScheduleSlotDto {
	disciplineName: string
	type: 'lecture' | 'practice' | 'lab'
	isOnline: boolean
	roomId?: string
	teacherIds?: string[]
}

export interface BulkScheduleDto {
	studyPlanId: string
	groupId: string
	halfYear: string // e.g. '2023H2'
	semester: number
	schedule: {
		even: Record<string, ScheduleSlotDto>
		odd: Record<string, ScheduleSlotDto>
	}
}

export interface AcademicWeekDto {
	id: string
	weekNumber: number
	startDate: string // ISO-строка
	endDate: string
	weekType: WeekType
}

export interface ScheduledPair {
	id: string
	halfYear: string
	weekType: WeekType
	dayOfWeek: string
	timeSlotId: string
	disciplineId: string
	isOnline: boolean
	// relations included by controller
	discipline: { id: string; name: string }
	timeSlot: { id: string; title: string }
	groups: { groupId: string; group: { id: string; title: string } }[]
	teachers: {
		teacher: {
			id: string
			user: { firstName: string; lastName: string; middleName?: string }
		}
	}[]
	rooms: { audience: { id: string; title: string } }[]
}

export interface BusyMap {
	even: Record<string, { rooms?: string[]; teachers?: string[] }>
	odd: Record<string, { rooms?: string[]; teachers?: string[] }>
}

class ScheduleService {
	private BASE = 'schedule'

	async bulkCreate(data: BulkScheduleDto): Promise<void> {
		try {
			console.log(data)
			await instance.post(`${this.BASE}`, data)
		} catch (error) {
			console.error('Error saving schedule bulk:', error)
			throw error
		}
	}

	async bulkCreateDistance(data: BulkScheduleDto): Promise<void> {
		try {
			await instance.post(`${this.BASE}/distance`, data)
		} catch (error) {
			console.error('Error saving distance schedule bulk:', error)
			throw error
		}
	}

	async getDistanceSchedule(
		groupId: string,
		studyPlanId: string,
		halfYear: string
	): Promise<any> {
		try {
			const resp = await instance.get<any>(`${this.BASE}/distance`, {
				params: { groupId, studyPlanId, halfYear },
			})
			console.log(resp.data)
			return resp.data // Возвращаем расписание заочной группы
		} catch (error) {
			console.error('Error fetching distance schedule:', error)
			throw error
		}
	}

	async getByGroup(
		groupId: string,
		halfYear: string,
		weekType: WeekType
	): Promise<ScheduledPair[]> {
		try {
			const resp = await instance.get<ScheduledPair[]>(
				`${this.BASE}/group/${groupId}`,
				{
					params: { halfYear, weekType },
				}
			)
			return resp.data
		} catch (error) {
			console.error(`Error fetching schedule for group ${groupId}:`, error)
			throw error
		}
	}

	async getBusyRooms(audienceId: string, halfYear: string): Promise<BusyMap> {
		try {
			const resp = await instance.get<BusyMap>(
				`${this.BASE}/room/${audienceId}/busy`,
				{ params: { halfYear } }
			)
			return resp.data
		} catch (error) {
			console.error(`Error fetching busy rooms for ${audienceId}:`, error)
			throw error
		}
	}

	async getBusyTeachers(
		teacherId: string,
		academicWeekId: string
	): Promise<any> {
		const resp = await instance.get<any>(
			`${this.BASE}/teacher/${teacherId}/busy`,
			{ params: { academicWeekId } }
		)
		return resp.data
	}

	// Возвращает полные записи ScheduledPair для кабинета
	async getBusyRoomRecords(
		audienceId: string,
		academicWeekId: string
	): Promise<any> {
		const resp = await instance.get<any>(
			`${this.BASE}/room/${audienceId}/busy`,
			{ params: { academicWeekId } }
		)
		return resp.data
	}

	// Возвращает полные записи ScheduledPair для преподавателя
	async getBusyTeacherRecords(
		teacherId: string,
		academicWeekId: string
	): Promise<ScheduledPair[]> {
		const resp = await instance.get<ScheduledPair[]>(
			`schedule/teacher/${teacherId}/busy`,
			{ params: { academicWeekId } }
		)
		return resp.data
	}

	async getBusyGroupRecords(
		groupId: string,
		academicWeekId: string
	): Promise<any> {
		const resp = await instance.get<any>(`${this.BASE}/group/${groupId}/busy`, {
			params: { academicWeekId },
		})
		return resp.data
	}

	/**
	 * Создаёт одну запись ScheduledPair
	 */
	async createScheduledPair(data: {
		groupId: string
		studyPlanId: string
		halfYear: string
		weekType: WeekType
		dayOfWeek: string
		timeSlotId: string
		discipline: string
		type: 'lecture' | 'practice' | 'lab'
		isOnline?: boolean
		roomId?: string
		teacherIds?: string[]
	}): Promise<ScheduledPair> {
		try {
			const resp = await instance.post<ScheduledPair>(`${this.BASE}/pair`, data)
			return resp.data
		} catch (error) {
			console.error('Error creating ScheduledPair:', error)
			throw error
		}
	}

	/**
	 * Обновляет существующую запись ScheduledPair по её id
	 */
	async updateScheduledPair(
		id: string,
		data: Partial<{
			discipline: string
			type: 'lecture' | 'practice' | 'lab'
			isOnline: boolean
			roomId?: string
			teacherIds?: string[]
			groupId?: string
		}>
	): Promise<ScheduledPair> {
		try {
			const resp = await instance.patch<ScheduledPair>(
				`${this.BASE}/pair/${id}`,
				data
			)
			return resp.data
		} catch (error) {
			console.error(`Error updating ScheduledPair ${id}:`, error)
			throw error
		}
	}

	/**
	 * Удаляет одну запись ScheduledPair по её id
	 */
	async deleteScheduledPair(id: string): Promise<void> {
		try {
			await instance.delete(`${this.BASE}/pair/${id}`)
		} catch (error) {
			console.error(`Error deleting ScheduledPair ${id}:`, error)
			throw error
		}
	}

	/**
	 * Получить список академических недель по коду полугодия (e.g. '2021H2')
	 */
	async getWeeksByHalfYear(halfYear: string): Promise<AcademicWeekDto[]> {
		try {
			const resp = await instance.get<AcademicWeekDto[]>(`${this.BASE}/weeks`, {
				params: { halfYear },
			})
			return resp.data
		} catch (error) {
			console.error(`Error fetching academic weeks for ${halfYear}:`, error)
			throw error
		}
	}
}

export default new ScheduleService()
