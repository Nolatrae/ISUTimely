import { instance } from '@/api/axios'

class GroupService {
	private BASE_URL = 'groups'

	// Создание группы
	async create(data: { title: string; countStudents: number }) {
		try {
			const response = await instance.post<{
				id: string
				title: string
				countStudents: number
			}>(this.BASE_URL, data)
			return response.data
		} catch (error) {
			console.error('Error creating group:', error)
			throw error
		}
	}

	// Получить группу по ID
	async get(id: string) {
		try {
			const response = await instance.get<{
				id: string
				title: string
				countStudents: number
			}>(`${this.BASE_URL}/${id}`)
			return response.data
		} catch (error) {
			console.error(`Error fetching group with ID ${id}:`, error)
			throw error
		}
	}

	// Получить все группы
	async getAll() {
		try {
			const response = await instance.get<
				{ id: string; title: string; countStudents: number }[]
			>(this.BASE_URL)
			return response.data
		} catch (error) {
			console.error('Error fetching groups list:', error)
			throw error
		}
	}

	// Обновление группы
	async update(id: string, data: { title: string; countStudents: number }) {
		try {
			const response = await instance.put<{
				id: string
				title: string
				countStudents: number
			}>(`${this.BASE_URL}/${id}`, data)
			return response.data
		} catch (error) {
			console.error(`Error updating group with ID ${id}:`, error)
			throw error
		}
	}

	// Удаление группы
	async delete(id: string) {
		try {
			const response = await instance.delete<{ message: string }>(
				`${this.BASE_URL}/${id}`
			)
			return response.data
		} catch (error) {
			console.error(`Error deleting group with ID ${id}:`, error)
			throw error
		}
	}
}

export default new GroupService()
