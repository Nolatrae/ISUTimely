import { useQuery } from '@tanstack/react-query'
import { Card, Popover, Segmented, Select, Space, Spin, Table } from 'antd'
import React, { useMemo, useState } from 'react'

import audienceService from '@/services/room/audience.service'
import type { ScheduledPair } from '@/services/schedule/schedule.service'
import scheduleService from '@/services/schedule/schedule.service'
import usersService from '@/services/user/users.service'
import { daysOfWeek, hoursOfDay } from '../constructor/const'

interface BusyResourcePageProps {
	yearOfAdmission?: number
}

// Карта перевода enum DayOfWeek -> русские названия
const ruDayMap: Record<string, string> = {
	MON: 'Понедельник',
	TUE: 'Вторник',
	WED: 'Среда',
	THU: 'Четверг',
	FRI: 'Пятница',
	SAT: 'Суббота',
	SUN: 'Воскресенье',
}

const ruTypeMap: Record<string, string> = {
	lecture: 'Лекция',
	practice: 'Практика',
}

const BusyResourcePage: React.FC<BusyResourcePageProps> = ({
	yearOfAdmission = 2021,
}) => {
	const [resourceType, setResourceType] = useState<'teacher' | 'room'>(
		'teacher'
	)
	const [resourceId, setResourceId] = useState<string | null>(null)
	const [semester, setSemester] = useState<number>(1)
	const [isEvenWeek, setIsEvenWeek] = useState<boolean>(true)

	// 1) Список преподавателей и кабинетов
	const { data: teachers = [] } = useQuery({
		queryKey: ['teachers'],
		queryFn: () => usersService.getAll(),
	})
	const { data: rooms = [] } = useQuery({
		queryKey: ['rooms'],
		queryFn: () => audienceService.getAll(),
	})

	// 2) Код полугодия вида "2021H2"
	const halfIndex = semester + 1
	const displayYear = yearOfAdmission + Math.floor((halfIndex - 1) / 2)
	const halfNumber = halfIndex % 2 === 0 ? 2 : 1
	const halfYearCode = `${displayYear}H${halfNumber}`

	// 3) Загружаем массив занятых пар с полной информацией
	const { data: busySlots = [], isFetching } = useQuery<ScheduledPair[]>({
		queryKey: ['busySlots', resourceType, resourceId, halfYearCode],
		queryFn: () =>
			resourceId
				? resourceType === 'teacher'
					? scheduleService.getBusyTeacherRecords(resourceId, halfYearCode)
					: scheduleService.getBusyRoomRecords(resourceId, halfYearCode)
				: Promise.resolve([]),
		enabled: Boolean(resourceId),
	})

	// 4) Группируем по ключу "День-Время" с русским днём и display title
	const slotsMap = useMemo(() => {
		const m: Record<string, ScheduledPair[]> = {}
		const filterWeek = isEvenWeek ? 'EVEN' : 'ODD'
		for (const p of busySlots) {
			if (p.weekType !== filterWeek) continue
			const dayLabel = ruDayMap[p.dayOfWeek] || p.dayOfWeek
			const slotLabel = p.timeSlot.title
			const key = `${dayLabel}-${slotLabel}`
			if (!m[key]) m[key] = []
			m[key].push(p)
		}
		return m
	}, [busySlots, isEvenWeek])

	const weekKey = isEvenWeek ? 'even' : 'odd'

	// 5) Определяем колонки таблицы
	const columns = [
		{
			title: 'Время',
			dataIndex: 'hour',
			key: 'hour',
			align: 'center' as const,
		},
		...daysOfWeek.map(day => ({
			title: day,
			dataIndex: day,
			key: day,
			align: 'center' as const,
			render: (_: any, rec: { hour: string }) => {
				const key = `${day}-${rec.hour}`
				const pairs = slotsMap[key]
				if (!pairs || !pairs.length) return <span>Свободно</span>
				return (
					<Popover
						title='Занятость'
						content={
							<div style={{ minWidth: 200 }}>
								{pairs.map(p => (
									<div key={p.id} style={{ marginBottom: 8 }}>
										<div>
											<b>{p.assignment.discipline}</b> —{' '}
											<em>
												{ruTypeMap[p.assignment.type] || p.assignment.type}
											</em>
										</div>
										{p.teachers?.length > 0 && (
											<div>
												Преподаватель:{' '}
												{p.teachers
													.map(t =>
														`${t.teacher?.user?.lastName || ''} ${
															t.teacher?.user?.firstName || ''
														}`.trim()
													)
													.join(', ')}
											</div>
										)}
										Группы: {p.groups.map(g => g.group.title).join(', ')}
									</div>
								))}
							</div>
						}
					>
						<span style={{ color: 'red', cursor: 'pointer' }}>
							Занято ({pairs.length})
						</span>
					</Popover>
				)
			},
		})),
	]

	return (
		<Card title='Занятость ресурса' style={{ margin: 16 }}>
			<Space wrap size='large' className='mb-4'>
				<Segmented
					options={[
						{ label: 'Преподаватель', value: 'teacher' },
						{ label: 'Кабинет', value: 'room' },
					]}
					value={resourceType}
					onChange={val => {
						setResourceType(val as 'teacher' | 'room')
						setResourceId(null)
					}}
				/>

				<Select
					style={{ width: 240 }}
					placeholder={
						resourceType === 'teacher'
							? 'Выберите преподавателя'
							: 'Выберите кабинет'
					}
					options={
						resourceType === 'teacher'
							? teachers.map(u => ({
									value: u.teacher?.id!,
									label: `${u.lastName} ${u.firstName}`,
							  }))
							: rooms.map(r => ({ value: r.id, label: r.title }))
					}
					value={resourceId}
					onChange={setResourceId}
				/>

				<Segmented
					options={Array.from({ length: 8 }, (_, i) => ({
						label: `${i + 1}`,
						value: i + 1,
					}))}
					value={semester}
					onChange={val => setSemester(val as number)}
				/>

				<Segmented
					options={[
						{ label: 'Чётная неделя', value: 'even' },
						{ label: 'Нечётная неделя', value: 'odd' },
					]}
					value={isEvenWeek ? 'even' : 'odd'}
					onChange={val => setIsEvenWeek(val === 'even')}
				/>
			</Space>

			{isFetching ? (
				<Spin />
			) : (
				<Table
					columns={columns}
					dataSource={hoursOfDay.map(h => ({ key: h, hour: h }))}
					pagination={false}
					size='middle'
				/>
			)}
		</Card>
	)
}

export default BusyResourcePage
