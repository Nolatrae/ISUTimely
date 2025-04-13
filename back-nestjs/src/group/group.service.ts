/* eslint-disable prettier/prettier */
import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { GroupDto } from './group.dto'

@Injectable()
export class GroupService {
	constructor(private prisma: PrismaService) {}

	// Получить группу по ID
	async getById(id: string) {
		const group = await this.prisma.group.findUnique({
			where: { id },
		})
		if (!group) {
			throw new NotFoundException(`Group with ID ${id} not found`)
		}
		return group
	}

	// Получить все группы
	async getAll() {
		return await this.prisma.group.findMany()
	}

	// Создать группу
	async create(data: GroupDto) {
		const existingGroup = await this.prisma.group.findFirst({
			where: { title: data.title },
		})

		if (existingGroup) {
			throw new ConflictException(
				`Group with title '${data.title}' already exists`
			)
		}

		return await this.prisma.group.create({ data })
	}

	async update(id: string, data: GroupDto) {
		const group = await this.prisma.group.findUnique({
			where: { id },
		})

		if (!group) {
			throw new NotFoundException(`Group with ID ${id} not found`)
		}

		const updatedGroupData = {
			title: data.title,
			countStudents: data.countStudents,
		}

		// Обновляем группу в базе данных
		return await this.prisma.group.update({
			where: { id },
			data: updatedGroupData,
		})
	}

	// Удалить группу
	async delete(id: string) {
		const group = await this.prisma.group.findUnique({
			where: { id },
		})

		if (!group) {
			throw new NotFoundException(`Group with ID ${id} not found`)
		}

		await this.prisma.group.delete({ where: { id } })

		return { message: `Group with ID ${id} successfully deleted` }
	}
}
