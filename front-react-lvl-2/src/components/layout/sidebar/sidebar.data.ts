import {
	Building,
	CakeSlice,
	CalendarX,
	DoorOpen,
	Drill,
	GraduationCap,
	Landmark,
	Layout,
	Merge,
	NotebookPen,
	Share2,
	ToyBrick,
	User,
	Users,
} from 'lucide-react'

import { PUBLIC_PAGES } from '@/config/pages/public.config'

import type { ISidebarItem } from './sidebar.types'

export const SIDEBAR_DATA: ISidebarItem[] = [
	{
		icon: CakeSlice,
		label: 'Пожелания',
		link: PUBLIC_PAGES.PLANS,
	},
	{
		icon: DoorOpen,
		label: 'Аудитории',
		link: PUBLIC_PAGES.ROOMCREATE,
	},
	{
		icon: Drill,
		label: 'Оборудование',
		link: PUBLIC_PAGES.EQUIPMENTCREATE,
	},
	{
		icon: NotebookPen,
		label: 'Парсер',
		link: PUBLIC_PAGES.PARSER,
	},
	{
		icon: User,
		label: 'Пользователи',
		link: PUBLIC_PAGES.USERS,
	},
	{
		icon: Users,
		label: 'Группы',
		link: PUBLIC_PAGES.GROUPS,
	},
	{
		icon: GraduationCap,
		label: 'Должности',
		link: PUBLIC_PAGES.POSITIONS,
	},
	{
		icon: Building,
		label: 'Кафедры',
		link: PUBLIC_PAGES.DEPARTMENTS,
	},
	{
		icon: Landmark,
		label: 'Здания',
		link: PUBLIC_PAGES.BUILDINGS,
	},
	{
		icon: Layout,
		label: 'Типы кабинетов',
		link: PUBLIC_PAGES.AUDIENCETYPES,
	},
	{
		icon: User,
		label: 'Профиль',
		link: PUBLIC_PAGES.PROFILE,
	},
	{
		icon: ToyBrick,
		label: 'Конструктор',
		link: PUBLIC_PAGES.CONSTRUCTOR,
	},
	{
		icon: Share2,
		label: 'Распределение пар',
		link: PUBLIC_PAGES.SETPAIRSTOTEACHER,
	},
	{
		icon: Merge,
		label: 'Объединение пар',
		link: PUBLIC_PAGES.MERGEDISCIPLINES,
	},
	{
		icon: CalendarX,
		label: 'Занятость ресурсов',
		link: PUBLIC_PAGES.BUSYRESOURCE,
	},
]
