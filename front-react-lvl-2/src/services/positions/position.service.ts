import { instance } from '@/api/axios'

class PositionService {
	private BASE_URL = 'position'

	async create(data: { title: string }) {
		try {
			const response = await instance.post<{ id: string; title: string }>(this.BASE_URL, data)
			return response.data
		} catch (error) {
			console.error('Error creating position:', error)
			throw error
		}
	}

	async get(id: string) {
		try {
			const response = await instance.get<{ id: string; title: string }>(`${this.BASE_URL}/${id}`)
			return response.data
		} catch (error) {
			console.error(`Error fetching position with ID ${id}:`, error)
			throw error
		}
	}

	async getAll() {
		try {
			const response = await instance.get<{ id: string; title: string }[]>(this.BASE_URL)
			console.log('Positions list:', response.data)
			return response.data
		} catch (error) {
			console.error('Error fetching position list:', error)
			throw error
		}
	}

	async update(id: string, data: { title: string }) {
		try {
			const response = await instance.put<{ id: string; title: string }>(
				`${this.BASE_URL}/${id}`,
				data
			)
			return response.data
		} catch (error) {
			console.error(`Error updating position with ID ${id}:`, error)
			throw error
		}
	}

	async delete(id: string) {
		try {
			const response = await instance.delete<{ message: string }>(`${this.BASE_URL}/${id}`)
			return response.data
		} catch (error) {
			console.error(`Error deleting position with ID ${id}:`, error)
			throw error
		}
	}
}

export default new PositionService()
