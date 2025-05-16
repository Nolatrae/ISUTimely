import { PrismaClient, WeekType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	// Стираем старые записи (если нужно)
	await prisma.academicWeek.deleteMany({})

	const startYear = 2021
	const endYear = 2040 // Генерируем с 2021 до 2040 включительно (20 лет)
	const allWeeks = [] as Array<{
		academicYear: string
		weekNumber: number
		startDate: Date
		endDate: Date
		weekType: WeekType
	}>

	for (let year = startYear; year <= endYear; year++) {
		const academicYear = `${year}/${year + 1}`

		// Находим первый понедельник сентября
		const firstSep = new Date(year, 8, 1) // месяц 8 = сентябрь
		const dayIndex = firstSep.getDay() // 0 = воскресенье, 1 = понедельник, ...
		const offsetDays = (1 + 7 - dayIndex) % 7
		const firstMonday = new Date(firstSep)
		firstMonday.setDate(firstSep.getDate() + offsetDays)

		for (let weekNumber = 1; weekNumber <= 52; weekNumber++) {
			const startDate = new Date(firstMonday)
			startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7)
			const endDate = new Date(startDate)
			endDate.setDate(startDate.getDate() + 6)

			const weekType = weekNumber % 2 === 0 ? WeekType.EVEN : WeekType.ODD

			allWeeks.push({ academicYear, weekNumber, startDate, endDate, weekType })
		}
	}

	// Вставляем все записи одним батчем
	await prisma.academicWeek.createMany({
		data: allWeeks.map(w => ({
			academicYear: w.academicYear,
			weekNumber: w.weekNumber,
			startDate: w.startDate,
			endDate: w.endDate,
			weekType: w.weekType,
		})),
	})

	console.log(
		`Inserted ${allWeeks.length} academic weeks from ${startYear} to ${endYear}.`
	)
}

main()
	.then(async () => {
		console.log('Done')
		await prisma.$disconnect()
	})
	.catch(async e => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
