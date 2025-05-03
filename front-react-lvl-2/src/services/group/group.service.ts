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

	async createReport(
		selectedGroupIds: string[],
		semester: string | null,
		educationForm: string | null
	) {
		if (!semester || !educationForm) {
			throw new Error('Полугодие или форма обучения не выбраны')
		}

		try {
			// Формируем данные для запроса
			const reportData = {
				groupIds: selectedGroupIds,
				semester: semester,
				educationForm: educationForm,
			}

			// Отправляем POST-запрос для создания отчёта
			const response = await instance.post(`report/generate`, reportData, {
				responseType: 'blob',
			})

			// Здесь получаем файл (например, PDF или Excel)
			const file = response.data
			const url = window.URL.createObjectURL(new Blob([file]))
			const link = document.createElement('a')
			link.href = url
			link.setAttribute('download', 'report.pdf') // Указываем имя файла
			document.body.appendChild(link)
			link.click() // Имитация клика для начала скачивания
			document.body.removeChild(link)

			return file
		} catch (error) {
			console.error('Ошибка при создании отчёта:', error)
			throw error
		}
	}
}

export default new GroupService()
