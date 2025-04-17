import { instance } from '@/api/axios'

export interface TeacherDisciplineAssignmentDto {
	id?: string
	discipline: string
	type: string
	teachers: string[]
}

class DisciplineService {
	private BASE_URL = 'disciplines'

	// ✅ Получение дисциплин по `studyPlanId`
	async getDisciplines(studyPlanId: string) {
		try {
			const response = await instance.get(`${this.BASE_URL}/${studyPlanId}`)
			return response.data
		} catch (error) {
			console.error('Ошибка при получении дисциплин:', error)
			throw error
		}
	}

	// ✅ Получение общих дисциплин по группам и семестру
	async getCommonDisciplines(groupIds: string[], semester: number) {
		try {
			const response = await instance.post(`${this.BASE_URL}/common`, {
				groupIds,
				semester,
			})
			console.log(response)
			return response.data
		} catch (error) {
			console.error('Ошибка при получении общих дисциплин:', error)
			throw error
		}
	}

	// ✅ Отправка выбранных дисциплин на сервер
	async sendSelectedDisciplines(
		disciplines: string[],
		groupIds: string[],
		semester: number
	) {
		console.log(disciplines, groupIds, semester)
		try {
			const response = await instance.post(`${this.BASE_URL}/assign`, {
				disciplines,
				groupIds,
				semester,
			})
			return response.data
		} catch (error) {
			console.error('Ошибка при отправке выбранных дисциплин:', error)
			throw error
		}
	}

	// ✅ Получение форматированных дисциплин
	// Метод возвращает уникальные названия дисциплин, для каждого из которых создаёт два объекта: lecture и practice
	async getFormattedDisciplines(groupIds?: string[], semester?: number) {
		try {
			const response = await instance.post(`${this.BASE_URL}/formatted`, {
				groupIds,
				semester,
			})
			return response.data
		} catch (error) {
			console.error('Ошибка при получении форматированных дисциплин:', error)
			throw error
		}
	}

	// Метод для обновления назначений преподавателей для дисциплин
	async updateTeacherAssignments(
		assignments: TeacherDisciplineAssignmentDto[]
	) {
		try {
			const response = await instance.post(`${this.BASE_URL}/assign-teachers`, {
				assignments,
			})
			return response.data
		} catch (error) {
			console.error('Ошибка при обновлении назначений преподавателей:', error)
			throw error
		}
	}

	// Новый метод для получения пар преподавателя по ID
	async getTeacherPairs(teacherId: string) {
		try {
			console.log(teacherId)
			const response = await instance.post(
				`${this.BASE_URL}/teacher/${teacherId}/pairs`
			)
			return response.data
		} catch (error) {
			console.error('Ошибка при получении пар преподавателя:', error)
			throw error
		}
	}

	async getTeacherText(teacherId: string) {
		try {
			// console.log(teacherId)
			const response = await instance.post(
				`${this.BASE_URL}/teacher/${teacherId}/text`
			)
			return response.data
		} catch (error) {
			console.error('Ошибка при получении текста преподавателя:', error)
			throw error
		}
	}

	// Получение всех пар преподавателей
	async getAllTeacherPairs() {
		try {
			const response = await instance.get(`${this.BASE_URL}/all/pairs`)
			console.log(response)
			return response.data
		} catch (error) {
			console.error('Ошибка при получении всех пар преподавателей:', error)
			throw error
		}
	}

	// Получение всех текстовых пожеланий преподавателей
	async getAllTeacherTextWishes() {
		try {
			const response = await instance.get(`${this.BASE_URL}/all/texts`)
			return response.data
		} catch (error) {
			console.error('Ошибка при получении всех текстов преподавателей:', error)
			throw error
		}
	}

	async saveTeacherPreferences(
		teacherId: string,
		preferences: {
			audienceTypes: {
				discipline: string
				type: string
				audienceTypeId: string
			}[]
			wishText: string
		}
	) {
		try {
			const response = await instance.post(
				`${this.BASE_URL}/${teacherId}/preferences`,
				preferences
			)
			return response.data
		} catch (error) {
			console.error('Ошибка при сохранении предпочтений преподавателя:', error)
			throw error
		}
	}
}

export const disciplineService = new DisciplineService()
