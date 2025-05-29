import * as XLSX from 'xlsx'
import { getCellValue } from './getCellValue'

/**
 * Автоматически определяет столбцы по ключевым словам в строке заголовков,
 * затем динамически находит столбцы "Контроль" для каждого семестра,
 * и собирает часы дисциплин по указанным диапазонам строк.
 */
export const extractDisciplines = (
	workbook: XLSX.WorkBook,
	isFull: boolean,
	start_1: number | string,
	end_1: number | string,
	start_2: number | string,
	end_2: number | string,
	start_3: number | string,
	end_3: number | string,
	start_4: number | string,
	end_4: number | string
) => {
	const results: Record<number, any[]> = {}
	const countWeeks: (string | number | null)[] = []

	const ranges = [
		{ sheetIndex: 8, start: start_1, end: end_1 },
		{ sheetIndex: 9, start: start_2, end: end_2 },
		{ sheetIndex: 10, start: start_3, end: end_3 },
		{ sheetIndex: 11, start: start_4, end: end_4 },
	]

	type Field =
		| 'lecture_hours'
		| 'el_lecture_hours'
		| 'laboratory_hours'
		| 'el_laboratory_hours'
		| 'practice_hours'
		| 'el_practice_hours'

	const fieldMap: Record<string, Field> = {
		лек: 'lecture_hours',
		'лек электр': 'el_lecture_hours',
		лаб: 'laboratory_hours',
		'лаб электр': 'el_laboratory_hours',
		пр: 'practice_hours',
		'пр электр': 'el_practice_hours',
	}
	const headerKeywords = Object.keys(fieldMap)

	/**
	 * Находит строку с заголовками и маппинг двух колонок для каждого ключевого поля (без контроля).
	 */
	function getHeaderMapping(sheet: XLSX.Sheet) {
		const rng = XLSX.utils.decode_range(sheet['!ref']!)
		const rowSettings = sheet['!rows'] || []
		const colSettings = sheet['!cols'] || []
		const maxRow = Math.min(rng.s.r + 9, rng.e.r)

		for (let R = rng.s.r; R <= maxRow; ++R) {
			if (rowSettings[R]?.hidden) continue
			const tmp: Record<Field, string[]> = {
				lecture_hours: [],
				el_lecture_hours: [],
				laboratory_hours: [],
				el_laboratory_hours: [],
				practice_hours: [],
				el_practice_hours: [],
			}
			const found = new Set<string>()

			for (let C = rng.s.c; C <= rng.e.c; ++C) {
				if (colSettings[C]?.hidden) continue
				const ref = XLSX.utils.encode_cell({ c: C, r: R })
				const cell = sheet[ref]
				if (!cell || typeof cell.v !== 'string') continue
				const raw = cell.v.toString().toLowerCase().trim()
				const base = raw
					.replace(/[\.]/g, '')
					.replace(/\s*\d+\s*сем\b.*$/u, '')
					.trim()
				const fld = fieldMap[base]
				if (!fld) continue
				if (tmp[fld].length < 2) tmp[fld].push(XLSX.utils.encode_col(C))
				found.add(base)
			}
			if (headerKeywords.every(k => found.has(k))) {
				console.log(`Header row=${R}, mapped:`, tmp)
				return { row: R, columns: tmp }
			}
		}
		throw new Error(
			'Не нашли полноценную строку с заголовками (первые 10 видимых)'
		)
	}

	/**
	 * Для данной стартовой колонки (lecture_hours) ищет в строке headerRow
	 * первую попадающуюся ячейку слева с текстом "контроль".
	 */
	function findControlColumn(
		sheet: XLSX.Sheet,
		headerRow: number,
		startCol: string
	): string | null {
		const rng = XLSX.utils.decode_range(sheet['!ref']!)
		const colSettings = sheet['!cols'] || []
		let cIdx = XLSX.utils.decode_col(startCol)
		while (cIdx >= rng.s.c) {
			if (colSettings[cIdx]?.hidden) {
				cIdx--
				continue
			}
			const ref = XLSX.utils.encode_cell({ c: cIdx, r: headerRow })
			const cell = sheet[ref]
			if (cell && typeof cell.v === 'string') {
				console.log(cell)
				if (cell.v.toString().toLowerCase().includes('контроль')) {
					return XLSX.utils.encode_col(cIdx)
				}
			}
			cIdx--
		}
		return null
	}

	// Основной цикл по листам
	for (const { sheetIndex, start, end } of ranges) {
		const sheet = workbook.Sheets[workbook.SheetNames[sheetIndex]]
		const rowSettings = sheet['!rows'] || []
		const colSettings = sheet['!cols'] || []

		// Недели
		const even = getCellValue(sheet, isFull ? 'AB16' : 'AD16')
		const odd = getCellValue(sheet, isFull ? 'AX16' : 'AE16')
		countWeeks.push(even, odd)

		// Заголовки
		const { row: headerRow, columns } = getHeaderMapping(sheet)
		// Динамически находим столбец control для каждого семестра
		const controlCols = columns.lecture_hours.map(lh =>
			findControlColumn(sheet, headerRow, lh)
		)

		// Чтение строк
		for (let row = +start; row <= +end; row++) {
			if (rowSettings[row]?.hidden) continue
			const name = getCellValue(sheet, `E${row}`)
			if (!name) continue
			;(['sem1', 'sem2'] as const).forEach((semKey, idx) => {
				const key = sheetIndex * 2 - 16 + (idx + 1)
				if (!results[key]) results[key] = []

				const pickVal = (fld: Field) => {
					const arr = columns[fld]
					const col = arr[idx]
					if (!col) return null
					const cIdx = XLSX.utils.decode_col(col)
					if (colSettings[cIdx]?.hidden) return null
					return getCellValue(sheet, `${col}${row}`)
				}

				const controlRaw = controlCols[idx]
					? getCellValue(sheet, `${controlCols[idx]}${row}`)
					: null
				const control = controlRaw != null ? String(controlRaw) : null
				const lecture_hours = pickVal('lecture_hours')
				const el_lecture_hours = pickVal('el_lecture_hours')
				const laboratory_hours = pickVal('laboratory_hours')
				const el_laboratory_hours = pickVal('el_laboratory_hours')
				const practice_hours = pickVal('practice_hours')
				const el_practice_hours = pickVal('el_practice_hours')

				if (
					control == null &&
					lecture_hours == null &&
					laboratory_hours == null &&
					practice_hours == null
				)
					return

				results[key].push({
					name,
					control,
					lecture_hours,
					el_lecture_hours,
					laboratory_hours,
					el_laboratory_hours,
					practice_hours,
					el_practice_hours,
				})
			})
		}
	}

	return { results, countWeeks }
}
