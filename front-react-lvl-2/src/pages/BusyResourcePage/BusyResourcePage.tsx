import { useQuery } from '@tanstack/react-query'
import {
	Button,
	Popover,
	Radio,
	Segmented,
	Select,
	Space,
	Spin,
	Table,
} from 'antd'
import React, { useMemo, useState } from 'react'

import audienceService from '@/services/room/audience.service'
import type { ScheduledPair } from '@/services/schedule/schedule.service'
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
	const [resourceId, setResourceId] = useState<string | undefined>(undefined)
	const [halfYearCode, setHalfYearCode] = useState<string>('2021H1')
	const [isEvenWeek, setIsEvenWeek] = useState<boolean>(true)
	const [tableVisibility, setTableVisibility] = useState<
		'one' | 'two' | 'both'
	>('both')
	const [numberSelection, setNumberSelection] = useState<number>(1)

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

	const weekTypeNotNull = busySlots.filter(slot => slot.weekType !== null)
	const weekTypeNull = busySlots.filter(slot => slot.weekType === null)

	const slotsMap = useMemo(() => {
		const m: Record<string, ScheduledPair[]> = {}
		const filterWeek = isEvenWeek ? 'EVEN' : 'ODD'

		for (const p of weekTypeNotNull) {
			if (p.weekType !== filterWeek) continue
			const dayLabel = ruDayMap[p.dayOfWeek] || p.dayOfWeek
			const slotLabel = p.timeSlot.title
			const key = `${dayLabel}-${slotLabel}`
			if (!m[key]) m[key] = []
			m[key].push(p)
		}
		return m
	}, [weekTypeNotNull, isEvenWeek])

	const slotsMapNullWeek = useMemo(() => {
		const m: Record<string, ScheduledPair[]> = {}
		const filterNumberWeek = numberSelection

		for (const p of weekTypeNull) {
			if (p.numberWeek !== filterNumberWeek) continue
			const dayLabel = ruDayMap[p.dayOfWeek] || p.dayOfWeek
			const slotLabel = p.timeSlot.title
			const key = `${dayLabel}-${slotLabel}`
			if (!m[key]) m[key] = []
			m[key].push(p)
		}

		return m
	}, [weekTypeNull, numberSelection])

	const columns = [
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
			width: '50px',
		},
		...daysOfWeek.map(day => ({
			title: day,
			dataIndex: day,
			key: day,
			align: 'center' as const,
			render: (_: any, rec: { hour: string }) => {
				const key = `${day}-${rec.hour}`
				const pairs = slotsMap[key]
				if (!pairs || !pairs.length) {
					return <span>Свободно</span>
				}
				return (
					<div className='text-left'>
						{pairs.map(p => (
							<div key={p.id} className=''>
								<div className='font-medium'>
									{p.assignment.discipline}{' '}
									<em>({ruTypeMap[p.assignment.type] || p.assignment.type})</em>
								</div>
								{p.teachers?.length > 0 && (
									<div>
										{/* <span className='font-semibold'>Преподаватель: </span> */}
										{p.teachers
											.map(t =>
												`${t.teacher?.user?.lastName || ''} ${
													t.teacher?.user?.firstName || ''
												}
												${t.teacher?.user?.middleName || ''}
												`.trim()
											)
											.join(', ')}
									</div>
								)}
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
	]

	const columnsNullWeek = [
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
			width: '50px',
		},
		...daysOfWeek.map(day => ({
			title: day,
			dataIndex: day,
			key: day,
			align: 'center' as const,
			render: (_: any, rec: { hour: string }) => {
				const key = `${day}-${rec.hour}`
				const pairs = slotsMapNullWeek[key] // Используем slotsMapNullWeek для второго расписания
				if (!pairs || !pairs.length) {
					return <span>Свободно</span>
				}
				return (
					<div className='text-left'>
						{pairs.map(p => (
							<div key={p.id} className=''>
								<div className='font-medium'>
									{p.assignment.discipline}{' '}
									<em>({ruTypeMap[p.assignment.type] || p.assignment.type})</em>
								</div>
								{p.teachers?.length > 0 && (
									<div>
										{p.teachers
											.map(t =>
												`${t.teacher?.user?.lastName || ''} ${
													t.teacher?.user?.firstName || ''
												}
												${t.teacher?.user?.middleName || ''}`.trim()
											)
											.join(', ')}
									</div>
								)}
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
	]

	const handleTableVisibilityChange = (e: any) => {
		setTableVisibility(e.target.value)
	}

	const popoverContent = (
		<Radio.Group
			value={tableVisibility}
			onChange={handleTableVisibilityChange}
			className='flex flex-col'
		>
			<Radio value='one'>Отображать только очное</Radio>
			<Radio value='two'>Отображать только заочное</Radio>
			<Radio value='both'>Отображать 2 одновременно</Radio>
		</Radio.Group>
	)

	return (
		<>
			<Space wrap size='large' className='mb-4'>
				<Popover
					content={popoverContent}
					title='Выбор расписания'
					trigger='click'
				>
					<Button icon={<EyeOutlined />} shape='default' size='middle' />
				</Popover>
				<Segmented
					options={[
						{ label: 'Преподаватель', value: 'teacher' },
						{ label: 'Кабинет', value: 'room' },
					]}
					value={resourceType}
					onChange={val => {
						setResourceType(val as 'teacher' | 'room')
						setResourceId(undefined)
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
							? teachers
									.filter(u => u.Teacher?.id != null)
									.map(u => ({
										value: String(u.Teacher!.id),
										label: `${u.lastName} ${u.firstName} ${u?.middleName}`,
									}))
							: rooms.map(r => ({ value: r.id, label: r.title }))
					}
					value={resourceId}
					onChange={setResourceId}
					allowClear
					showSearch
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
					style={{
						display:
							tableVisibility === 'one' || tableVisibility === 'both'
								? 'inline-block'
								: 'none',
					}} // Скрываем, если tableVisibility не one или both
				/>

				<Segmented
					options={[1, 2, 3, 4, 5].map(val => ({
						label: String(val),
						value: val,
					}))}
					value={numberSelection}
					onChange={setNumberSelection}
					style={{
						display:
							tableVisibility === 'two' || tableVisibility === 'both'
								? 'inline-block'
								: 'none',
					}} // Скрываем, если tableVisibility не two или both
				/>
			</Space>

			{isFetching ? (
				<Spin />
			) : (
				<div className='flex gap-1 busy-table'>
					{tableVisibility === 'one' || tableVisibility === 'both' ? (
						<div style={{ flex: 1 }}>
							<Table
								columns={columns}
								dataSource={hoursOfDay.map(h => ({ key: h, hour: h }))}
								pagination={false}
								bordered
								style={{ fontSize: '8px' }}
							/>
						</div>
					) : null}

					{tableVisibility === 'two' || tableVisibility === 'both' ? (
						<div style={{ flex: 1 }}>
							<Table
								columns={columnsNullWeek}
								dataSource={hoursOfDay.map(h => ({ key: h, hour: h }))}
								pagination={false}
								bordered
								style={{ fontSize: '8px' }}
							/>
						</div>
					) : null}
				</div>
			)}
		</>
	)
}

export default BusyResourcePage
