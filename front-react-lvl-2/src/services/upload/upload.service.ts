import { instance } from '@/api/axios'

class UploadService {
	private BASE_URL = '/api/uploads'

	// **Загрузка файла**
	async uploadFile(file: File) {
		const formData = new FormData()
		formData.append('file', file)

		try {
			const response = await instance.post<{ id: string }>(`${this.BASE_URL}/excel`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			})
			return response.data
		} catch (error) {
			console.error('Ошибка при загрузке файла:', error)
			throw error
		}
	}

	// **Скачивание файла**
	async downloadFile(fileId: string) {
		try {
			const response = await instance.get<Blob>(`${this.BASE_URL}/${fileId}`, {
				responseType: 'blob' // Указываем, что получаем бинарные данные
			})

			// Создаём ссылку для скачивания
			const url = window.URL.createObjectURL(response.data)
			const a = document.createElement('a')
			a.href = url
			a.download = `file-${fileId}.xlsx`
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Ошибка при скачивании файла:', error)
			throw error
		}
	}
}

export default new UploadService()
