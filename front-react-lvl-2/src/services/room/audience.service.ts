import { instance } from '@/api/axios'

import type { Audience, AudienceData } from '@/types/types'

// Импорт типов

class AudienceService {
	private BASE_URL = '/audiences'

	// Создание новой аудитории
	async create(data: AudienceData) {
		try {
			const response = await instance.post<{ id: string; title: string }>(
				this.BASE_URL,
				data
			)
			return response.data
		} catch (error) {
			console.error('Error creating audience:', error)
			throw error
		}
	}

	// Получение аудитории по ID
	async get(id: string) {
		try {
			const response = await instance.get<Audience>(`${this.BASE_URL}/${id}`)
			return response.data
		} catch (error) {
			console.error(`Error fetching audience with ID ${id}:`, error)
			throw error
		}
	}

	// Получение всех аудиторий
	async getAll() {
		try {
			const response = await instance.get<Audience[]>(this.BASE_URL)
			console.log('audience list', response.data)
			return response.data
		} catch (error) {
			console.error('Error fetching audience list:', error)
			throw error
		}
	}

	async update(data: any) {
		console.log(data)
		const { id, ...restData } = data
		console.log(id)
		try {
			const response = await instance.patch<{ id: string; title: string }>(
				`${this.BASE_URL}/${id}`,
				restData
			)
			return response.data
		} catch (error) {
			console.error(`Error updating audience with ID ${id}:`, error)
			throw error
		}
	}

	// Удаление аудитории по ID
	async delete(id: string) {
		try {
			const response = await instance.delete<{ message: string }>(
				`${this.BASE_URL}/${id}`
			)
			return response.data
		} catch (error) {
			console.error(`Error deleting audience with ID ${id}:`, error)
			throw error
		}
	}
}

export default new AudienceService()
