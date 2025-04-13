/* eslint-disable prettier/prettier */
// utils/extractSemesterWeeks.ts
import * as XLSX from 'xlsx';

export function extractSemesterWeeks(
  workbook: XLSX.WorkBook,
  sheets: { sheetIndex: number; start: string; end: string }[],
) {
  const weeksData = [];

  sheets.forEach(({ sheetIndex, start, end }) => {
    const sheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];

    // Пример извлечения недели для конкретного листа
    for (let row = parseInt(start); row <= parseInt(end); row++) {
      const weekData = {
        week_1: sheet[`A${row}`]?.v ?? 0, // Обновите с реальными столбцами
        week_2: sheet[`B${row}`]?.v ?? 0,
        week_3: sheet[`C${row}`]?.v ?? 0,
        week_4: sheet[`D${row}`]?.v ?? 0,
        week_5: sheet[`E${row}`]?.v ?? 0,
        week_6: sheet[`F${row}`]?.v ?? 0,
        week_7: sheet[`G${row}`]?.v ?? 0,
        week_8: sheet[`H${row}`]?.v ?? 0,
      };
      weeksData.push(weekData);
    }
  });

  return weeksData;
}
