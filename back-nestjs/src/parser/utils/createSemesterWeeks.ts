// utils/createSemesterWeeks.ts
export const extractWeek = (weekString: string | number): number => {
	const str = String(weekString)
	const match = str.match(/ТО:\s*(\d+)/)
	return match ? parseInt(match[1], 10) : 0
}
