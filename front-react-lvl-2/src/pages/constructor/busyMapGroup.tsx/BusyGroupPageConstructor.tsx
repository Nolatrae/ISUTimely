import { useQuery } from '@tanstack/react-query'
import { Segmented, Select, Space, Spin, Table } from 'antd'
import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { Group } from '@/pages/groups/Group'
import groupService from '@/services/group/group.service'
import scheduleService, {
	ScheduledPair,
} from '@/services/schedule/schedule.service'
import { daysOfWeek, hoursOfDay } from '../const'

interface BusyGroupPageProps {}

const ruDayMap: Record<string, string> = {
	MON: 'Понедельник',
	TUE: 'Вторник',
	WED: 'Среда',
	THU: 'Четверг',
	FRI: 'Пятница',
	SAT: 'Суббота',
	SUN: 'Воскресенье',
}

const useQueryParams = () => {
	const { search } = useLocation()
	return new URLSearchParams(search)
}

const BusyGroupPageConstructor: React.FC<BusyGroupPageProps> = () => {
	const query = useQueryParams()
	const yearOfAdmission = Number(query.get('yearOfAdmission'))
	const studyPlanId = query.get('studyPlanId') || ''
	const groupId = query.get('groupId') || ''

	const [halfYearCode, setHalfYearCode] = useState<string>('2021H1')
	const [isEvenWeek, setIsEvenWeek] = useState<boolean>(true)
	const [numberSelection, setNumberSelection] = useState<number>(1)

	// Получаем данные о группах
	const { data: groupData = [], isLoading: isGroupLoading } = useQuery<Group[]>(
		{
			queryKey: ['groups'],
			queryFn: () => groupService.get(groupId),
		}
	)

	const { data: busySlots = [], isFetching } = useQuery<ScheduledPair[]>({
		queryKey: ['busySlots', groupId, halfYearCode],
		queryFn: () =>
			groupId
				? scheduleService.getBusyGroupRecords(groupId, halfYearCode)
				: Promise.resolve([]),
		enabled: Boolean(groupId),
	})

	console.log(busySlots)

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
									{p.assignment.discipline} <em>({p.assignment.type})</em>
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
				const pairs = slotsMapNullWeek[key]
				if (!pairs || !pairs.length) {
					return <span>Свободно</span>
				}
				return (
					<div className='text-left'>
						{pairs.map(p => (
							<div key={p.id} className=''>
								<div className='font-medium'>
									{p.assignment.discipline} <em>({p.assignment.type})</em>
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

	const halfYearOptions = Array.from({ length: 8 }, (_, i) => {
		const year = yearOfAdmission + Math.floor(i / 2)
		const half = i % 2 === 0 ? 1 : 2
		return {
			value: `${year}H${half}`,
			label: `${i + 1} семестр`,
		}
	})

	return (
		<>
			<h2>Расписание группы {groupData?.title}</h2>
			<Space wrap size='large' className='my-4'>
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
				<Segmented
					options={[1, 2, 3, 4, 5].map(val => ({
						label: String(val),
						value: val,
					}))}
					value={numberSelection}
					onChange={setNumberSelection}
				/>
			</Space>

			{isFetching ? (
				<Spin />
			) : (
				<div className='flex gap-1 busy-table'>
					<div style={{ flex: 1 }}>
						<Table
							columns={columns}
							dataSource={hoursOfDay.map(h => ({ key: h, hour: h }))}
							pagination={false}
							bordered
							style={{ fontSize: '8px' }}
						/>
					</div>
					{/* <div style={{ flex: 1 }}>
						<Table
							columns={columnsNullWeek}
							dataSource={hoursOfDay.map(h => ({ key: h, hour: h }))}
							pagination={false}
							bordered
							style={{ fontSize: '8px' }}
						/>
					</div> */}
				</div>
			)}
		</>
	)
}

export default BusyGroupPageConstructor
