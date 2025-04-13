import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { hash, verify } from 'argon2'

import { PrismaService } from 'src/prisma.service'
import { ChangePasswordDto } from './user.dto'

function generateRandomPassword() {
	return Math.random().toString(36).slice(-8) // Простой вариант генерации
}

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async getAll() {
		return this.prisma.user.findMany({
			include: { Teacher: true }, // Подключаем данные учителя
		})
	}

	// Получение пользователя по ID
	async getById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			include: { Teacher: true }, // Присоединяем преподавательские данные
		})
		if (!user) throw new NotFoundException('Пользователь не найден')
		return user
	}

	// Добавление метода getByLogin в UserService
	async getByLogin(login: string) {
		const user = await this.prisma.user.findUnique({
			where: { login }, // Ищем пользователя по логину
			include: { Teacher: true }, // Если нужно, подключаем информацию о преподавателе
		})

		if (!user) throw new NotFoundException('Пользователь не найден')

		return user
	}

	// Создание пользователя
	async create(data: {
		login: string
		password: string
		firstName: string
		middleName?: string
		lastName: string
		rights: string[]
		positionId?: string
		departmentId?: string
		role: 'USER' | 'TEACHER' | 'ADMIN'
	}) {
		// Проверяем, существует ли пользователь с таким login
		const existingUser = await this.prisma.user.findUnique({
			where: { login: data.login },
		})

		if (existingUser) {
			throw new ConflictException(
				'Пользователь с таким логином уже существует!'
			)
		}

		// Хешируем пароль
		const tempPassword = generateRandomPassword()
		const hashedPassword = await hash(data.password)

		const user = await this.prisma.user.create({
			data: {
				login: data.login,
				password: hashedPassword,
				tempPassword,
				firstName: data.firstName,
				middleName: data.middleName,
				lastName: data.lastName,
				rights: [data.role],
			},
		})

		// Если это преподаватель, создаем запись в Teacher
		if (data.role === 'TEACHER' && data.positionId && data.departmentId) {
			await this.prisma.teacher.create({
				data: {
					userId: user.id,
					positionId: data.positionId,
					departmentId: data.departmentId,
				},
			})
		}

		return user
	}

	// Обновление пользователя
	// Обновление пользователя с учетом частичного обновления
	async update(
		id: string,
		data: {
			login?: string
			password?: string
			tempPassword?: string
			firstName?: string
			middleName?: string
			lastName?: string
			role?: string[]
			positionId?: string // Только для TEACHER
			departmentId?: string // Только для TEACHER
		}
	) {
		const updateData: any = {}

		if (data.login !== undefined) updateData.login = data.login

		if (data.password) {
			updateData.password = await hash(data.password)
		} else if (data.tempPassword !== undefined) {
			updateData.tempPassword = data.tempPassword
		}

		if (data.firstName !== undefined) updateData.firstName = data.firstName
		if (data.middleName !== undefined) updateData.middleName = data.middleName
		if (data.lastName !== undefined) updateData.lastName = data.lastName

		// Преобразуем role: если значение строка, то оборачиваем в массив
		if (data.role !== undefined) {
			updateData.rights = Array.isArray(data.role) ? data.role : [data.role]
		}

		const user = await this.prisma.user.update({
			where: { id },
			data: updateData,
		})

		// Обновляем данные преподавателя, если указаны соответствующие поля
		if (
			(Array.isArray(data.role)
				? data.role.includes('TEACHER')
				: data.role === 'TEACHER') &&
			data.positionId &&
			data.departmentId
		) {
			await this.prisma.teacher.upsert({
				where: { userId: id },
				update: {
					positionId: data.positionId,
					departmentId: data.departmentId,
				},
				create: {
					userId: id,
					positionId: data.positionId,
					departmentId: data.departmentId,
				},
			})
		}

		return user
	}

	async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
		const { oldPassword, newPassword } = changePasswordDto
		// Находим пользователя по ID
		const user = await this.prisma.user.findUnique({ where: { id } })
		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}
		// Проверяем, совпадает ли старый пароль
		const isPasswordValid = await verify(user.password, oldPassword)
		if (!isPasswordValid) {
			throw new BadRequestException('Старый пароль неверен')
		}
		// Хешируем новый пароль
		const hashedNewPassword = await hash(newPassword)
		// Обновляем пароль и временный пароль (если требуется)
		await this.prisma.user.update({
			where: { id },
			data: {
				password: hashedNewPassword,
				tempPassword: newPassword,
			},
		})
		return { message: 'Пароль успешно обновлён' }
	}

	// Удаление пользователя (и, если он преподаватель, удаление Teacher)
	async delete(id: string) {
		// Удаляем преподавателя, если он есть
		await this.prisma.teacher.deleteMany({ where: { userId: id } })

		// Удаляем самого пользователя
		return this.prisma.user.delete({ where: { id } })
	}
}
