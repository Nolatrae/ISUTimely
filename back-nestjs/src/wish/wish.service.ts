/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { wishesDto } from './wish.dto'

@Injectable()
export class WishesService {
	constructor(private readonly prisma: PrismaService) {}

	async addWishes(dto: wishesDto, userId: string) {
		const { wishes, notes } = dto

		// Найти учителя по userId
		const teacher = await this.prisma.teacher.findUnique({
			where: { userId },
		})

		if (!teacher) {
			throw new Error('Teacher not found')
		}

		const teacherId = teacher.id
		// console.log('Teacher ID:', teacherId)

		// Удаляем старые пожелания
		await this.prisma.scheduleWish.deleteMany({ where: { teacherId } })
		await this.prisma.textWish.deleteMany({ where: { teacherId } })

		// Добавляем текстовое пожелание
		if (notes) {
			await this.prisma.textWish.create({
				data: {
					teacherId,
				},
			})
		}

		// Добавляем расписание пожеланий
		for (const weekType of ['even', 'odd']) {
			const weekWishes = wishes[weekType as keyof typeof wishes]

			for (const [dayTime, wish] of Object.entries(weekWishes)) {
				const [day, timeSlot] = dayTime.split('-')
				const wishData = wish as { discipline?: string; room?: string }

				await this.prisma.scheduleWish.create({
					data: {
						weekType,
						day,
						timeSlot,
						discipline: wishData.discipline || null,
						room: wishData.room || null,
						teacherId,
					},
				})
			}
		}

		return { message: 'Wishes saved successfully' }
	}

	async getAllWishes() {
		// Получаем все текстовые пожелания вместе с данными о преподавателе
		const textWishes = await this.prisma.textWish.findMany({
			include: { teacher: true },
		})

		// Получаем все пожелания расписания с данными о преподавателе
		const scheduleWishes = await this.prisma.scheduleWish.findMany({
			include: { teacher: true },
			orderBy: { createdAt: 'desc' },
		})

		// Объединяем оба массива, добавляя поле type для различия
		const combinedWishes = [
			...textWishes.map(wish => ({ ...wish, type: 'text' })),
			...scheduleWishes.map(wish => ({ ...wish, type: 'schedule' })),
		]

		return combinedWishes
	}
}
