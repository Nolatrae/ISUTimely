import { UserRole } from '@/services/auth/auth.types'

export interface IUser {
	id: number
	name?: string
	login: string
	rights: UserRole[]
}

export interface IFormData extends Pick<IUser, 'login'> {
	password: string
}
