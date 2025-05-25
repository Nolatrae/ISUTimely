import { useQuery } from '@tanstack/react-query'
import { Button, Popover, Segmented, Select, Space, Spin, Table } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useMemo, useState } from 'react'

import groupService from '@/services/group/group.service'
import audienceService from '@/services/room/audience.service'
import type {
	AcademicWeekDto,
	ScheduledPair,
} from '@/services/schedule/schedule.service'
import scheduleService from '@/services/schedule/schedule.service'
import usersService from '@/services/user/users.service'
import { EyeOutlined } from '@ant-design/icons'
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
	lab: 'Лабораторная',
}

const halfYearOptions = Array.from({ length: 10 }, (_, i) => {
	const year = 2021 + Math.floor(i / 2)
	const half = i % 2 === 0 ? 1 : 2
	return {
		value: `${year}H${half}`,
		label: `${year} год — ${half} полугодие`,
	}
})

const fmt = (date: string | Date) => dayjs(date).format('DD.MM')

const BusyResourcePage: React.FC<BusyResourcePageProps> = ({
	yearOfAdmission = 2021,
}) => {
	/* selections */
	const [resourceType, setResourceType] = useState<
		'teacher' | 'room' | 'group'
	>('teacher')
	const [resourceId, setResourceId] = useState<string | undefined>()
	const [halfYearCode, setHalfYearCode] = useState<string>('2021H1')
	const [weekId, setWeekId] = useState<string | undefined>()

	/* master-data */
	const { data: teachers = [] } = useQuery({
		queryKey: ['teachers'],
		queryFn: () => usersService.getAll(),
	})
	const { data: rooms = [] } = useQuery({
		queryKey: ['rooms'],
		queryFn: () => audienceService.getAll(),
	})
	const { data: groupsData = [] } = useQuery<Group[]>({
		queryKey: ['groups'],
		queryFn: () => groupService.getAll(),
	})

	/* academic weeks for selected half-year */
	const { data: weeks = [], isFetching: weeksLoading } = useQuery<
		AcademicWeekDto[]
	>({
		queryKey: ['weeksByHalfYear', halfYearCode],
		queryFn: () => scheduleService.getWeeksByHalfYear(halfYearCode),
		enabled: Boolean(halfYearCode),
	})

	/* pick first weekId when weeks arrive */
	useEffect(() => {
		if (weeks.length && !weekId) {
			setWeekId(weeks[0].id)
		}
	}, [weeks])

	/* schedule (busySlots) */
	const { data: busySlots = [], isFetching: slotsLoading } = useQuery<
		ScheduledPair[]
	>({
		queryKey: ['busySlots', resourceType, resourceId, weekId],
		queryFn: () => {
			if (!resourceId || !weekId) {
				return Promise.resolve([])
			}
			switch (resourceType) {
				case 'teacher':
					return scheduleService.getBusyTeacherRecords(resourceId, weekId)
				case 'room':
					return scheduleService.getBusyRoomRecords(resourceId, weekId)
				case 'group':
					return scheduleService.getBusyGroupRecords(resourceId, weekId)
			}
		},
		enabled: Boolean(resourceId && weekId),
	})

	/* build slotsMap for table */
	const slotsMap = useMemo(() => {
		const m: Record<string, ScheduledPair[]> = {}
		for (const p of busySlots) {
			const dayLabel = ruDayMap[p.dayOfWeek] || p.dayOfWeek
			const slotLabel = p.timeSlot.title
			const key = `${dayLabel}-${slotLabel}`
			if (!m[key]) m[key] = []
			m[key].push(p)
		}
		return m
	}, [busySlots])

	/* table columns */
	const columns = useMemo(
		() => [
			{
				title: 'Время',
				dataIndex: 'hour',
				key: 'hour',
				align: 'center' as const,
				render: (time: string) => {
					const [start, end] = time.split(' — ')
					return (
						<div style={{ whiteSpace: 'nowrap' }}>
							<div>{start}</div>
							<div>{end}</div>
						</div>
					)
				},
				width: 80,
			},
			...daysOfWeek.map(day => ({
				title: day,
				dataIndex: day,
				key: day,
				align: 'center' as const,
				render: (_: any, rec: { hour: string }) => {
					const key = `${day}-${rec.hour}`
					const pairs = slotsMap[key]
					if (!pairs?.length) {
						return <span>Свободно</span>
					}
					return (
						<div className='text-left'>
							{pairs.map(p => (
								<div key={p.id} className='mb-2'>
									<div className='font-medium'>
										{p.assignment.discipline}{' '}
										<em>
											({ruTypeMap[p.assignment.type] || p.assignment.type})
										</em>
									</div>
									{/* отображаем первого преподавателя */}
									{p.teachers?.length > 0 && (
										<div>
											{p.teachers
												.map(t =>
													`${t.teacher.user.lastName} ${
														t.teacher.user.firstName
													} ${t.teacher.user.middleName || ''}`.trim()
												)
												.join(', ')}
										</div>
									)}
									{/* отображаем кабинет */}
									{p.rooms?.length > 0 && (
										<div>
											<span className='font-semibold'>Кабинет: </span>
											{p.rooms.map(r => r.audience.title).join(', ')}
										</div>
									)}
									{/* отображаем группы */}
									<div>
										<span className='font-semibold'>Группы: </span>
										{p.groups.map(g => g.group.title).join(', ')}
									</div>
								</div>
							))}
						</div>
					)
				},
			})),
		],
		[slotsMap]
	)

	/* week select options */
	const weekOptions = weeks.map(w => ({
		value: w.id,
		label: `${w.weekNumber} | ${fmt(w.startDate)}–${fmt(w.endDate)}`,
	}))

	const loading = weeksLoading || slotsLoading

	return (
		<>
			<Space wrap size='large' className='mb-4'>
				<Popover
					content={<span>Настройки будут позже</span>}
					title='Опции'
					trigger='click'
				>
					<Button icon={<EyeOutlined />} />
				</Popover>

				<Segmented
					options={[
						{ label: 'Преподаватель', value: 'teacher' },
						{ label: 'Кабинет', value: 'room' },
						{ label: 'Группа', value: 'group' },
					]}
					value={resourceType}
					onChange={val => {
						setResourceType(val as 'teacher' | 'room' | 'group')
						setResourceId(undefined)
					}}
				/>

				<Select
					style={{ width: 240 }}
					showSearch
					allowClear
					placeholder={
						resourceType === 'teacher'
							? 'Выберите преподавателя'
							: resourceType === 'room'
							? 'Выберите кабинет'
							: 'Выберите группу'
					}
					options={
						resourceType === 'teacher'
							? teachers
									.filter(u => u.Teacher?.id)
									.map(u => ({
										value: u.Teacher!.id,
										label: `${u.lastName} ${u.firstName} ${
											u.middleName || ''
										}`.trim(),
									}))
							: resourceType === 'room'
							? rooms.map(r => ({ value: r.id, label: r.title }))
							: groupsData.map(g => ({ value: g.id, label: g.title }))
					}
					value={resourceId}
					onChange={setResourceId}
				/>

				<Select
					style={{ width: 180 }}
					options={halfYearOptions}
					value={halfYearCode}
					onChange={val => {
						setHalfYearCode(val)
						setWeekId(undefined)
					}}
				/>

				{!!weekOptions.length && (
					<Select
						style={{ width: 220 }}
						placeholder='Неделя'
						options={weekOptions}
						value={weekId}
						onChange={setWeekId}
						loading={weeksLoading}
						disabled={!weekOptions.length}
					/>
				)}
			</Space>

			{loading ? (
				<Spin />
			) : (
				<Table
					columns={columns}
					dataSource={hoursOfDay.map(h => ({ key: h, hour: h }))}
					pagination={false}
					bordered
					size='small'
					scroll={{ x: 'max-content' }}
				/>
			)}
		</>
	)
}

export default BusyResourcePage
