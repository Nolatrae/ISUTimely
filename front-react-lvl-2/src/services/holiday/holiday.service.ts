import { instance } from '@/api/axios'

export interface HolidayDto {
	date: string // одна дата
	name: string
	roomId?: string
	timeSlots: string[] // новые таймслоты (массив строк)
}

class HolidayService {
	private BASE = 'holiday'

	/** Создать праздник */
	async createHoliday(dto: HolidayDto): Promise<void> {
		await instance.post(`${this.BASE}`, dto)
	}

	/** Получить все праздники */
	async getHolidays(): Promise<HolidayDto[]> {
		const { data } = await instance.get<HolidayDto[]>(`${this.BASE}`)
		return data
	}
}

export default new HolidayService()
