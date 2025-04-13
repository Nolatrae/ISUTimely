/* eslint-disable prettier/prettier */
// Функция для получения значения ячейки по адресу
export const getCellValue = (sheet, cellAddress) => {
  const cell = sheet[cellAddress];
  return cell ? cell.v : null;
};
