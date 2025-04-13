// types.ts
import { daysOfWeek, hoursOfDay } from './const'

export type DayOfWeek = (typeof daysOfWeek)[number] // Тип дня недели
export type HourOfDay = (typeof hoursOfDay)[number] // Тип часа дня
