import { instance } from '@/api/axios'

// Новый DTO для постоянного
export interface RecurringHolidayDto {
	startDate: string // ISO-строка начала
	endDate: string // ISO-строка конца
	dayOfWeek: string // 'MON' | 'TUE' | … | 'SUN'
	name: string
	roomId?: string
	timeSlots: string[]
}

// Существующий DTO остаётся для разового
export interface HolidayDto {
	date: string // ISO-строка
	name: string
	roomId?: string
	timeSlots: string[]
}

class HolidayService {
	private BASE = 'holiday'

	/** Разовое событие */
	async createOneTimeHoliday(dto: HolidayDto): Promise<void> {
		await instance.post(`${this.BASE}/one-time`, dto)
	}

	/** Постоянное: каждую неделю в указанный день */
	async createRecurringHoliday(dto: RecurringHolidayDto): Promise<void> {
		await instance.post(`${this.BASE}/recurring`, dto)
	}

	/** Можно оставить для чтения всех праздников */
	async getHolidays(): Promise<HolidayDto[]> {
		const { data } = await instance.get<HolidayDto[]>(`${this.BASE}`)
		return data
	}
}

export default new HolidayService()
