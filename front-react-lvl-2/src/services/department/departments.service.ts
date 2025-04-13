import { instance } from '@/api/axios'

class DepartmentService {
	private BASE_URL = 'departments'

	async create(data: {title:string}) {
		try {
			const response = await instance.post<{ id: string; title: string }>(this.BASE_URL, data)
			return response.data
		} catch (error) {
			console.error('Error creating department:', error)
			throw error
		}
	}

	async get(id: string) {
		try {
			const response = await instance.get<{ id: string; title: string }>(`${this.BASE_URL}/${id}`)
			return response.data
		} catch (error) {
			console.error(`Error fetching departments with ID ${id}:`, error)
			throw error
		}
	}

	async getAll() {
		try {
			const response = await instance.get<{ id: string; title: string }[]>(this.BASE_URL)
			console.log('departments list', response.data)
			return response.data
		} catch (error) {
			console.error('Error fetching department list:', error)
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
			console.error(`Error updating department with ID ${id}:`, error)
			throw error
		}
	}

	async delete(id: string) {
		try {
			const response = await instance.delete<{ message: string }>(`${this.BASE_URL}/${id}`)
			return response.data
		} catch (error) {
			console.error(`Error deleting department with ID ${id}:`, error)
			throw error
		}
	}
}

export default new DepartmentService()
