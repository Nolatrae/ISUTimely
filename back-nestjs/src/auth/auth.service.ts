import { PrismaService } from '@/prisma.service'
import { UserService } from '@/user/user.service'
import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Role, type User } from '@prisma/client'
import { verify } from 'argon2'
import { omit } from 'lodash'

@Injectable()
export class AuthService {
	constructor(
		private jwt: JwtService,
		private userService: UserService,
		private prisma: PrismaService
	) {}

	private readonly TOKEN_EXPIRATION_ACCESS = '1h'
	private readonly TOKEN_EXPIRATION_REFRESH = '7d'

	async login(dto: any) {
		const user = await this.validateUser(dto)
		return this.buildResponseObject(user)
	}

	async register(dto: any) {
		const userExists = await this.userService.getByLogin(dto.login)
		if (userExists) {
			throw new BadRequestException('User already exists')
		}
		const user = await this.userService.create(dto)

		return this.buildResponseObject(user)
	}

	async getNewTokens(refreshToken: string) {
		const result = await this.jwt.verifyAsync(refreshToken)
		if (!result) {
			throw new UnauthorizedException('Invalid refresh token')
		}
		const user = await this.userService.getById(result.id)
		return this.buildResponseObject(user)
	}

	async buildResponseObject(user: User) {
		const tokens = await this.issueTokens(user.id, user.rights)
		return { user: this.omitPassword(user), ...tokens }
	}

	private async issueTokens(userId: string, rights: Role[]) {
		const payload = { id: userId, rights }
		const accessToken = this.jwt.sign(payload, {
			expiresIn: this.TOKEN_EXPIRATION_ACCESS,
		})
		const refreshToken = this.jwt.sign(payload, {
			expiresIn: this.TOKEN_EXPIRATION_REFRESH,
		})
		return { accessToken, refreshToken }
	}

	private async validateUser(dto: any) {
		const user = await this.userService.getByLogin(dto.login)
		if (!user) {
			throw new UnauthorizedException('Login or password invalid')
		}
		const isValid = await verify(user.password, dto.password)
		if (!isValid) {
			throw new UnauthorizedException('Login or password invalid')
		}
		return user
	}

	private omitPassword(user: User) {
		return omit(user, ['password'])
	}
}
