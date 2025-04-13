import { Auth } from '@/auth/decorators/auth.decorator'
import { CurrentUser } from '@/auth/decorators/user.decorator'
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from '@nestjs/common'
import { ChangePasswordDto, UpdateProfileDto } from './user.dto'
import { UserService } from './user.service'

@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Auth()
	@Get('profile')
	async getProfile(@CurrentUser('id') id: string) {
		return this.userService.getById(id)
	}

	@Get()
	getAll() {
		return this.userService.getAll()
	}

	// Создание нового пользователя
	@Post()
	async create(
		@Body()
		data: {
			login: string
			password: string
			firstName: string
			middleName?: string
			lastName: string
			rights: string[]
			positionId?: string
			departmentId?: string
			role: 'USER' | 'TEACHER' | 'ADMIN'
		}
	) {
		return this.userService.create(data)
	}

	// Обновление пользователя
	@Patch(':id')
	async update(
		@Param('id') id: string,
		@Body() updateProfileDto: UpdateProfileDto
	) {
		return this.userService.update(id, updateProfileDto)
	}

	// Удаление пользователя
	@Delete(':id')
	async delete(@Param('id') id: string) {
		return this.userService.delete(id)
	}

	@Patch('/profile/:id')
	async updateProfile(
		@Param('id') id: string,
		@Body() updateProfileDto: UpdateProfileDto
	) {
		return this.userService.update(id, updateProfileDto)
	}

	@Patch('/profile/:id/password')
	async changePassword(
		@Param('id') id: string,
		@Body() changePasswordDto: ChangePasswordDto
	) {
		return this.userService.changePassword(id, changePasswordDto)
	}
}
