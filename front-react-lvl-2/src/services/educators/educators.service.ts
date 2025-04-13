import { instance } from '@/api/axios'

class EquipmentService {
	private BASE_URL = '/educators'

	async create(data: { title: string }) {
		try {
			console.log(data)
			const response = await instance.post<{ id: string; title: string }>(
				this.BASE_URL,
				data
			)
			return response.data
		} catch (error) {
			console.error('Error creating equipment:', error)
			throw error
		}
	}

	async get(id: string) {
		try {
			const response = await instance.get<{ id: string; title: string }>(
				`${this.BASE_URL}/${id}`
			)
			return response.data
		} catch (error) {
			console.error(`Error fetching equipment with ID ${id}:`, error)
			throw error
		}
	}

	async getAll() {
		try {
			console.log('get all')
			const response = await instance.get<{ id: string; title: string }[]>(
				this.BASE_URL
			)
			console.log('equipment list', response.data)
			return response.data
		} catch (error) {
			console.error('Error fetching equipment list:', error)
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
			console.error(`Error updating equipment with ID ${id}:`, error)
			throw error
		}
	}

	async delete(id: string) {
		try {
			const response = await instance.delete<{ message: string }>(
				`${this.BASE_URL}/${id}`
			)
			return response.data
		} catch (error) {
			console.error(`Error deleting equipment with ID ${id}:`, error)
			throw error
		}
	}
}

export default new EquipmentService()
