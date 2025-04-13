/* eslint-disable prettier/prettier */
import XLSX from 'xlsx';
import { StudyPlanData } from '../types/types';
import { getCellValue } from './getCellValue';

export const extractDataFromFirstSheet = (
  workbook: XLSX.WorkBook,
): StudyPlanData => {
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  const programm = getCellValue(firstSheet, 'D29')
    .replace(/\d+|\./g, '')
    .trim(); // Программа
  const code = getCellValue(firstSheet, 'D27'); // Код программы
  const profile = getCellValue(firstSheet, 'D30'); // Профиль
  const department = getCellValue(firstSheet, 'D37'); // Кафедра
  const facultet = getCellValue(firstSheet, 'D38'); // Факультет
  const qualification = getCellValue(firstSheet, 'C40').match(/\S+$/)[0]; // Квалификация
  const yearEnrollment = getCellValue(firstSheet, 'W40'); // Год начала подготовки
  const stydyYear = getCellValue(firstSheet, 'W41'); // Учебный год
  const formEducation = getCellValue(firstSheet, 'C42').match(/\S+$/)[0]; // Форма обучения

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
  };
};
