export enum UserRole {
	USER = 'USER',
	TEACHER = 'TEACHER',
	ADMIN = 'ADMIN',
}

export interface ITokenInside {
	id: number
	rights: UserRole[]
	iat: number
	exp: number
}

export type TProtectUserData = Omit<ITokenInside, 'iat' | 'exp'>
