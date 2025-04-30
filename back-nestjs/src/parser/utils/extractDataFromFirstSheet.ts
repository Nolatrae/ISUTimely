/* eslint-disable prettier/prettier */
import XLSX from 'xlsx'
import { StudyPlanData } from '../types/types'
import { getCellValue } from './getCellValue'

export const extractDataFromFirstSheet = (
	workbook: XLSX.WorkBook,
	isFull: boolean
): StudyPlanData => {
	const firstSheetName = workbook.SheetNames[0]
	const firstSheet = workbook.Sheets[firstSheetName]

	let programm: string,
		code: string,
		profile: string,
		department: string,
		facultet: string,
		qualification: string,
		yearEnrollment: string,
		stydyYear: string,
		formEducation: string,
		duration: string

	if (isFull) {
		// Для очной формы обучения
		programm = getCellValue(firstSheet, 'D29')
			.replace(/\d+|\./g, '')
			.trim() // Программа
		code = getCellValue(firstSheet, 'D27') // Код программы
		profile = getCellValue(firstSheet, 'D30') // Профиль
		department = getCellValue(firstSheet, 'D37') // Кафедра
		facultet = getCellValue(firstSheet, 'D38') // Факультет
		qualification = getCellValue(firstSheet, 'C40').match(/\S+$/)[0] // Квалификация
		yearEnrollment = getCellValue(firstSheet, 'W40') // Год начала подготовки
		stydyYear = getCellValue(firstSheet, 'W41') // Учебный год
		formEducation = getCellValue(firstSheet, 'C42').match(/\S+$/)[0] // Форма обучения
		duration = getCellValue(firstSheet, 'C43') // Продолжительность
	} else {
		// Для заочной формы обучения
		programm = getCellValue(firstSheet, 'D19')
			.replace(/\d+|\./g, '')
			.trim() // Программа
		code = getCellValue(firstSheet, 'D17') // Код программы
		profile = getCellValue(firstSheet, 'D20') // Профиль
		department = getCellValue(firstSheet, 'D27') // Кафедра
		facultet = getCellValue(firstSheet, 'D28') // Факультет
		qualification = getCellValue(firstSheet, 'C30').match(/\S+$/)[0] // Квалификация
		yearEnrollment = getCellValue(firstSheet, 'W30') // Год начала подготовки
		stydyYear = getCellValue(firstSheet, 'W31') // Учебный год
		formEducation = getCellValue(firstSheet, 'C32').match(/\S+$/)[0] // Форма обучения
		duration = getCellValue(firstSheet, 'C33') // Продолжительность
	}

	return {
		programm,
		code,
		profile,
		department,
		facultet,
		qualification,
		yearEnrollment,
		stydyYear,
		formEducation,
		duration,
	}
}
