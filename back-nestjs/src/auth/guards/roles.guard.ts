import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role, User } from '@prisma/client'
import { Request } from 'express'

@Injectable()
export class RolesGuard implements CanActivate {
	private static readonly ALLOWED_ROLES: Role[] = ['USER', 'TEACHER', 'ADMIN']
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>()
		const user = request.user as User

		const hasRole = () =>
			user.rights.some(role => RolesGuard.ALLOWED_ROLES.includes(role))

		if (!hasRole()) {
			throw new ForbiddenException('У тебя нет прав!')
		}

		return true
	}
}
