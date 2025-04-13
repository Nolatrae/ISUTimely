export class UpdateProfileDto {
	readonly firstName?: string
	readonly middleName?: string
	readonly lastName?: string
	readonly positionId?: string // для преподавателей
	readonly departmentId?: string // для преподавателей
	readonly login?: string
	readonly password?: string
	readonly role?: string[]
}

export class ChangePasswordDto {
	readonly oldPassword: string
	readonly newPassword: string
}
