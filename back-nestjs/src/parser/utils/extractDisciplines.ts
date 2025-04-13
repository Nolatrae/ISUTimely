/* eslint-disable prettier/prettier */
import { getCellValue } from './getCellValue';

export const extractDisciplines = (
  workbook,
  start_1,
  end_1,
  start_2,
  end_2,
  start_3,
  end_3,
  start_4,
  end_4,
) => {
  const results = {};

  // Массив с диапазонами строк для каждого курса
  const ranges = [
    { sheetIndex: 8, start: start_1, end: end_1 }, // Первый курс
    { sheetIndex: 9, start: start_2, end: end_2 }, // Второй курс
    { sheetIndex: 10, start: start_3, end: end_3 }, // Третий курс
    { sheetIndex: 11, start: start_4, end: end_4 }, // Четвертый курс
  ];

  const countWeeks = [];

  for (const range of ranges) {
    const sheetName = workbook.SheetNames[range.sheetIndex];
    const sheet = workbook.Sheets[sheetName];

    const evenSemester = getCellValue(sheet, 'AB16');
    const oddSemester = getCellValue(sheet, 'AX16');

    countWeeks.push(evenSemester, oddSemester);

    for (let row = range.start; row <= range.end; row++) {
      const name = getCellValue(sheet, `E${row}`);

      // Функция для извлечения и проверки данных
      const getHours = (sheet, col1, col2, row) => {
        const val1 = getCellValue(sheet, `${col1}${row}`);
        const val2 = getCellValue(sheet, `${col2}${row}`);
        return {
          sem1: val1 !== undefined ? val1 : null,
          sem2: val2 !== undefined ? val2 : null,
        };
      };

      const control = getHours(sheet, 'G', 'AC', row);

      // Получаем часы для лекций, лабораторных и практических занятий
      const lecture_hours = getHours(sheet, 'J', 'AF', row);
      const el_lecture_hours = getHours(sheet, 'K', 'AG', row);
      const laboratory_hours = getHours(sheet, 'M', 'AI', row);
      const el_laboratory_hours = getHours(sheet, 'N', 'AJ', row);
      const practice_hours = getHours(sheet, 'P', 'AL', row);
      const el_practice_hours = getHours(sheet, 'Q', 'AM', row);

      // Определяем семестры, которые нужно добавить
      if (
        control.sem1 !== null ||
        lecture_hours.sem1 !== null ||
        el_lecture_hours.sem1 !== null ||
        laboratory_hours.sem1 !== null ||
        el_laboratory_hours.sem1 !== null ||
        practice_hours.sem1 !== null ||
        el_practice_hours.sem1 !== null
      ) {
        if (!results[range.sheetIndex * 2 - 15]) {
          results[range.sheetIndex * 2 - 15] = [];
        }
        results[range.sheetIndex * 2 - 15].push({
          name,
          control: control.sem1,
          lecture_hours: lecture_hours.sem1,
          el_lecture_hours: el_lecture_hours.sem1,
          laboratory_hours: laboratory_hours.sem1,
          el_laboratory_hours: el_laboratory_hours.sem1,
          practice_hours: practice_hours.sem1,
          el_practice_hours: el_practice_hours.sem1,
        });
      }

      if (
        control.sem2 !== null ||
        lecture_hours.sem2 !== null ||
        el_lecture_hours.sem2 !== null ||
        laboratory_hours.sem2 !== null ||
        el_laboratory_hours.sem2 !== null ||
        practice_hours.sem2 !== null ||
        el_practice_hours.sem2 !== null
      ) {
        if (!results[range.sheetIndex * 2 - 14]) {
          results[range.sheetIndex * 2 - 14] = [];
        }
        results[range.sheetIndex * 2 - 14].push({
          name,
          control: control.sem2,
          lecture_hours: lecture_hours.sem2,
          el_lecture_hours: el_lecture_hours.sem2,
          laboratory_hours: laboratory_hours.sem2,
          el_laboratory_hours: el_laboratory_hours.sem2,
          practice_hours: practice_hours.sem2,
          el_practice_hours: el_practice_hours.sem2,
        });
      }
    }
  }

  return { results, countWeeks };
};
