import { instance } from '@/api/axios'

class WishesService {
	private BASE_URL = 'wish'

	async sendWishes(id: any, wishes: any, notes: any) {
		const data = { id, wishes, notes }

		console.log(wishes)

		const response = instance.post(this.BASE_URL, data)
		return response
	}

	async getAllWishes() {
		const response = instance.get(this.BASE_URL)
		return response
	}
}

export default new WishesService()
