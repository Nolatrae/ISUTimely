import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
	Button,
	Form,
	Input,
	Popover,
	Segmented,
	Select,
	Space,
	Spin,
	Table,
} from 'antd'
import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { Group } from '@/pages/groups/Group'
import groupService from '@/services/group/group.service'
import scheduleService, {
	ScheduledPair,
} from '@/services/schedule/schedule.service'
import usersService from '@/services/user/users.service'
import { PlusOutlined } from '@ant-design/icons'
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

const ruTypeOptions = [
	{ label: 'Лекция', value: 'lecture' },
	{ label: 'Практика', value: 'practice' },
]

const useQueryParams = () => {
	const { search } = useLocation()
	return new URLSearchParams(search)
}

const BusyGroupPageConstructor: React.FC<BusyGroupPageProps> = () => {
	const query = useQueryParams()
	const yearOfAdmission = Number(query.get('yearOfAdmission'))
	const studyPlanId = query.get('studyPlanId') || ''
	const groupId = query.get('groupId') || ''

	const qc = useQueryClient()

	const [halfYearCode, setHalfYearCode] = useState<string>('2021H1')
	const [isEvenWeek, setIsEvenWeek] = useState<boolean>(true)
	const [numberSelection] = useState<number>(1)

	const { data: groupData, isLoading: isGroupLoading } = useQuery<Group>({
		queryKey: ['group', groupId],
		queryFn: () => groupService.get(groupId),
		enabled: Boolean(groupId),
	})

	const { data: teachers = [] } = useQuery({
		queryKey: ['teachers'],
		queryFn: () => usersService.getAll(),
	})
	const teacherOptions = teachers
		.filter(u => u.Teacher?.id)
		.map(u => ({
			label: `${u.lastName} ${u.firstName}`,
			value: u.Teacher!.id,
		}))

	const { data: busySlots = [], isFetching } = useQuery<ScheduledPair[]>({
		queryKey: ['busySlots', groupId, halfYearCode],
		queryFn: () =>
			groupId
				? scheduleService.getBusyGroupRecords(groupId, halfYearCode)
				: Promise.resolve([]),
		enabled: Boolean(groupId),
	})

	const weekTypeNotNull = busySlots.filter(s => s.weekType !== null)
	const weekTypeNull = busySlots.filter(s => s.weekType === null)

	const slotsMap = useMemo(() => {
		const m: Record<string, ScheduledPair[]> = {}
		const filterWeek = isEvenWeek ? 'EVEN' : 'ODD'
		weekTypeNotNull.forEach(p => {
			if (p.weekType !== filterWeek) return
			const key = `${ruDayMap[p.dayOfWeek] || p.dayOfWeek}-${p.timeSlot.title}`
			m[key] = m[key] ?? []
			m[key].push(p)
		})
		return m
	}, [weekTypeNotNull, isEvenWeek])

	const slotsMapNullWeek = useMemo(() => {
		const m: Record<string, ScheduledPair[]> = {}
		weekTypeNull.forEach(p => {
			if (p.numberWeek !== numberSelection) return
			const key = `${ruDayMap[p.dayOfWeek] || p.dayOfWeek}-${p.timeSlot.title}`
			m[key] = m[key] ?? []
			m[key].push(p)
		})
		return m
	}, [weekTypeNull, numberSelection])

	const halfYearOptions = Array.from({ length: 8 }, (_, i) => {
		const year = yearOfAdmission + Math.floor(i / 2)
		const half = i % 2 === 0 ? 1 : 2
		return {
			value: `${year}H${half}`,
			label: `${i + 1} семестр`,
		}
	})

	// Форма для редактирования пары
	const renderEditForm = (pair: ScheduledPair) => (
		<Form
			layout='vertical'
			initialValues={{
				discipline: pair.assignment.discipline,
				type: pair.assignment.type,
				teacherId: pair.teachers[0]?.teacherId,
			}}
			onFinish={vals =>
				scheduleService
					.updateScheduledPair(pair.id, {
						discipline: vals.discipline,
						type: vals.type,
						teacherIds: [vals.teacherId],
					})
					.then(() =>
						qc.invalidateQueries(['busySlots', groupId, halfYearCode])
					)
			}
		>
			<Form.Item
				name='discipline'
				label='Дисциплина'
				rules={[{ required: true }]}
			>
				<Input />
			</Form.Item>
			<Form.Item name='type' label='Тип занятия' rules={[{ required: true }]}>
				<Select options={ruTypeOptions} />
			</Form.Item>
			<Form.Item
				name='teacherId'
				label='Преподаватель'
				rules={[{ required: true }]}
			>
				<Select options={teacherOptions} showSearch />
			</Form.Item>
			<Form.Item>
				<Space>
					<Button htmlType='submit' type='primary' size='small'>
						Сохранить
					</Button>
					<Button
						danger
						size='small'
						onClick={() =>
							scheduleService
								.deleteScheduledPair(pair.id)
								.then(() =>
									qc.invalidateQueries(['busySlots', groupId, halfYearCode])
								)
						}
					>
						Удалить
					</Button>
				</Space>
			</Form.Item>
		</Form>
	)

	// Форма для добавления новой пары в пустую ячейку
	const renderAddForm = (dayOfWeek: string, timeSlotId: string) => (
		<Form
			layout='vertical'
			initialValues={{ discipline: '', type: 'lecture', teacherId: undefined }}
			onFinish={vals =>
				scheduleService
					.createScheduledPair({
						groupId,
						studyPlanId,
						halfYear: halfYearCode,
						weekType: isEvenWeek ? 'EVEN' : 'ODD',
						dayOfWeek,
						timeSlotId,
						discipline: vals.discipline,
						type: vals.type,
						teacherIds: [vals.teacherId],
					})
					.then(() =>
						qc.invalidateQueries(['busySlots', groupId, halfYearCode])
					)
			}
		>
			<Form.Item
				name='discipline'
				label='Дисциплина'
				rules={[{ required: true }]}
			>
				<Input />
			</Form.Item>
			<Form.Item name='type' label='Тип занятия' rules={[{ required: true }]}>
				<Select options={ruTypeOptions} />
			</Form.Item>
			<Form.Item
				name='teacherId'
				label='Преподаватель'
				rules={[{ required: true }]}
			>
				<Select options={teacherOptions} showSearch />
			</Form.Item>
			<Form.Item>
				<Button htmlType='submit' type='primary' size='small'>
					Добавить
				</Button>
			</Form.Item>
		</Form>
	)

	const baseColumns = [
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
			width: 60,
		},
	]

	const columns = [
		...baseColumns,
		...daysOfWeek.map(day => ({
			title: day,
			dataIndex: day,
			key: day,
			align: 'center' as const,
			render: (_: any, rec: { hour: string }) => {
				const key = `${day}-${rec.hour}`
				const pairs = slotsMap[key] || []
				if (pairs.length > 0) {
					return (
						<div>
							{pairs.map(p => (
								<Popover
									key={p.id}
									trigger='contextMenu'
									content={renderEditForm(p)}
									title='Редактировать пару'
								>
									<div className='text-left p-1 hover:bg-gray-100'>
										<div className='font-medium'>
											{p.assignment.discipline} <em>({p.assignment.type})</em>
										</div>
										<div>
											{p.teachers
												.map(
													t =>
														`${t.teacher?.user?.lastName} ${t.teacher?.user?.firstName}`
												)
												.join(', ')}
										</div>
									</div>
								</Popover>
							))}
						</div>
					)
				}
				return (
					<Popover
						trigger='click'
						content={renderAddForm(day, rec.hour)}
						title='Добавить пару'
					>
						<div className='text-center text-gray-400 p-2 rounded hover:bg-gray-200 w-fit mx-auto'>
							<PlusOutlined />
						</div>
					</Popover>
				)
			},
		})),
	]

	return (
		<>
			<h2>Расписание группы {groupData?.title}</h2>
			<Space wrap size='large' className='my-4'>
				<Select
					style={{ width: 180 }}
					options={halfYearOptions}
					value={halfYearCode}
					onChange={setHalfYearCode}
				/>
				<Segmented
					options={[
						{ label: 'Чётная неделя', value: 'even' },
						{ label: 'Нечётная неделя', value: 'odd' },
					]}
					value={isEvenWeek ? 'even' : 'odd'}
					onChange={v => setIsEvenWeek(v === 'even')}
				/>
			</Space>

			{false ? (
				<Spin />
			) : (
				<Table
					columns={columns}
					dataSource={hoursOfDay.map(h => ({ key: h, hour: h }))}
					pagination={false}
					bordered
					size='small'
					loading={isFetching}
				/>
			)}
		</>
	)
}

export default BusyGroupPageConstructor
