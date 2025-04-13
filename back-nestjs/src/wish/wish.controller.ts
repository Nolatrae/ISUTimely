/* eslint-disable prettier/prettier */
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common'
import { WishesService } from './wish.service'

@Controller('wish')
export class WishesController {
	constructor(private readonly wishesService: WishesService) {}

	@Post()
	@HttpCode(200)
	async create(@Body() dto: any) {
		const { id, ...restDto } = dto
		return this.wishesService.addWishes(restDto, id)
	}

	@Get()
	async getAll() {
		return this.wishesService.getAllWishes()
	}
}
