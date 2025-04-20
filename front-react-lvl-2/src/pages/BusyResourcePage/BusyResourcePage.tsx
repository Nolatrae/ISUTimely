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

const ruDayMap: Record<string, string> = {
	MON: 'Понедельник',
	TUE: 'Вторник',
	WED: 'Среда',
	THU: 'Четверг',
	FRI: 'Пятница',
	SAT: 'Суббота',
	SUN: 'Воскресенье',
}

export const ruTypeMap: Record<string, string> = {
	lecture: 'Лекция',
	practice: 'Практика',
}

const halfYearOptions = Array.from({ length: 10 }, (_, i) => {
	const year = 2021 + Math.floor(i / 2)
	const half = i % 2 === 0 ? 1 : 2
	return {
		value: `${year}H${half}`,
		label: `${year} год — ${half} полугодие`,
	}
})

const BusyResourcePage: React.FC<BusyResourcePageProps> = ({
	yearOfAdmission = 2021,
}) => {
	const [resourceType, setResourceType] = useState<'teacher' | 'room'>(
		'teacher'
	)
	const [resourceId, setResourceId] = useState<string | null>(null)
	const [halfYearCode, setHalfYearCode] = useState<string>('2021H1')
	const [isEvenWeek, setIsEvenWeek] = useState<boolean>(true)

	const { data: teachers = [] } = useQuery({
		queryKey: ['teachers'],
		queryFn: () => usersService.getAll(),
	})
	const { data: rooms = [] } = useQuery({
		queryKey: ['rooms'],
		queryFn: () => audienceService.getAll(),
	})

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

				<Select
					style={{ width: 180 }}
					options={halfYearOptions}
					value={halfYearCode}
					onChange={val => setHalfYearCode(val)}
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
