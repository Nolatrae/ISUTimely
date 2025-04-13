import { instance } from '@/api/axios'

class UsersService {
	private BASE_URL = 'users'

	private transliterate(text: string): string {
		const cyrillicToLatinMap: Record<string, string> = {
			А: 'A',
			а: 'a',
			Б: 'B',
			б: 'b',
			В: 'V',
			в: 'v',
			Г: 'G',
			г: 'g',
			Д: 'D',
			д: 'd',
			Е: 'E',
			е: 'e',
			Ё: 'E',
			ё: 'e',
			Ж: 'Zh',
			ж: 'zh',
			З: 'Z',
			з: 'z',
			И: 'I',
			и: 'i',
			Й: 'Y',
			й: 'y',
			К: 'K',
			к: 'k',
			Л: 'L',
			л: 'l',
			М: 'M',
			м: 'm',
			Н: 'N',
			н: 'n',
			О: 'O',
			о: 'o',
			П: 'P',
			п: 'p',
			Р: 'R',
			р: 'r',
			С: 'S',
			с: 's',
			Т: 'T',
			т: 't',
			У: 'U',
			у: 'u',
			Ф: 'F',
			ф: 'f',
			Х: 'Kh',
			х: 'kh',
			Ц: 'Ts',
			ц: 'ts',
			Ч: 'Ch',
			ч: 'ch',
			Ш: 'Sh',
			ш: 'sh',
			Щ: 'Shch',
			щ: 'shch',
			Ы: 'Y',
			ы: 'y',
			Э: 'E',
			э: 'e',
			Ю: 'Yu',
			ю: 'yu',
			Я: 'Ya',
			я: 'ya',
			Ь: '',
			ь: '',
			Ъ: '',
			ъ: '',
		}

		return text
			.split('')
			.map(char => cyrillicToLatinMap[char] || char)
			.join('')
	}

	// Генерация сложного временного пароля (12 символов: буквы, цифры, спецсимволы)
	private generateTempPassword(): string {
		const chars =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'
		let password = ''
		for (let i = 0; i < 12; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length))
		}
		return password
	}

	// Генерация логина (фамилия латиницей)
	private generateLogin(lastName: string): string {
		const transliterated = this.transliterate(lastName)
		const suffix = Math.floor(Math.random() * 1000) // пара символов
		return (
			transliterated.charAt(0).toUpperCase() +
			transliterated.slice(1).toLowerCase() +
			suffix
		)
	}

	// Создание пользователя (логин генерируется, `tempPassword` устанавливается, `password` не создается)
	async create(data: {
		firstName: string
		lastName: string
		middleName: string
		role?: 'USER' | 'ADMIN' | 'TEACHER'
		positionId?: string
		departmentId?: string
	}) {
		try {
			console.log(data.middleName)
			const generatedLogin = this.generateLogin(data.lastName)
			const generatedTempPassword = this.generateTempPassword()

			console.log(data.role)

			const requestData = {
				login: generatedLogin,
				tempPassword: generatedTempPassword,
				password: '123456',
				firstName: data.firstName,
				middleName: data.middleName,
				lastName: data.lastName,
				role: data.role || 'TEACHER',
				positionId: data.positionId,
				departmentId: data.departmentId,
			}

			const response = await instance.post<{
				id: string
				login: string
				tempPassword: string
			}>(this.BASE_URL, requestData)

			console.log(
				`✅ Пользователь создан: Логин ${generatedLogin}, Временный пароль ${response.data.tempPassword}`
			)
			return response.data
		} catch (error) {
			console.error('❌ Ошибка при создании пользователя:', error)
			throw error
		}
	}

	// Получить пользователя по ID (с возможностью увидеть временный пароль)
	async get(id: string) {
		try {
			const response = await instance.get<{
				id: string
				login: string
				firstName: string
				lastName: string
				role: string
				tempPassword?: string
			}>(`${this.BASE_URL}/${id}`)
			return response.data
		} catch (error) {
			console.error(`❌ Ошибка при получении пользователя с ID ${id}:`, error)
			throw error
		}
	}

	async getAll() {
		try {
			console.log('getAll')
			const response = await instance.get<
				{
					id: string
					login: string
					firstName: string
					middleName: string
					lastName: string
					role: string
					tempPassword?: string
				}[]
			>(this.BASE_URL)
			// console.log(response.data)
			return response.data
		} catch (error) {
			console.error('❌ Ошибка при получении списка пользователей:', error)
			throw error
		}
	}

	async updateProfile(id: string, data: any) {
		try {
			const response = await instance.patch<{ id: string; login: string }>(
				`${this.BASE_URL}/profile/${id}`,
				data
			)
			return response.data
		} catch (error) {
			console.error(`❌ Ошибка при обновлении пользователя с ID ${id}:`, error)
			throw error
		}
	}

	async changePassword(id: string, oldPassword: string, newPassword: string) {
		try {
			const response = await instance.patch<{ message: string }>(
				`${this.BASE_URL}/profile/${id}/password`,
				{ oldPassword, newPassword }
			)
			return response.data
		} catch (error) {
			console.error(
				`❌ Ошибка при смене пароля пользователя с ID ${id}:`,
				error
			)
			throw error
		}
	}

	// Обновить данные пользователя
	async update(
		id: string,
		data: {
			firstName?: string
			lastName?: string
			role?: string
			positionId?: string
			departmentId?: string
		}
	) {
		try {
			const response = await instance.patch<{ id: string; login: string }>(
				`${this.BASE_URL}/${id}`,
				data
			)
			return response.data
		} catch (error) {
			console.error(`❌ Ошибка при обновлении пользователя с ID ${id}:`, error)
			throw error
		}
	}

	// Сброс временного пароля (генерирует новый `tempPassword`)
	async resetTempPassword(id: string) {
		try {
			const newTempPassword = this.generateTempPassword()

			const response = await instance.patch<{
				id: string
				login: string
				tempPassword: string
			}>(
				`${this.BASE_URL}/${id}`,
				{ tempPassword: newTempPassword } // Обновляем только временный пароль
			)

			console.log(
				`✅ Новый временный пароль для пользователя ${id}: ${response.data.tempPassword}`
			)
			return response.data
		} catch (error) {
			console.error(
				`❌ Ошибка при сбросе временного пароля у пользователя с ID ${id}:`,
				error
			)
			throw error
		}
	}

	// Удалить пользователя
	async delete(id: string) {
		try {
			const response = await instance.delete<{ message: string }>(
				`${this.BASE_URL}/${id}`
			)
			return response.data
		} catch (error) {
			console.error(`❌ Ошибка при удалении пользователя с ID ${id}:`, error)
			throw error
		}
	}
}

export default new UsersService()
