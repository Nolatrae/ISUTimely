import { ScheduledPair } from '@/services/schedule/schedule.service'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Card, Dropdown, Input, List, Menu, Popover } from 'antd'
import React, { memo, useCallback, useState } from 'react'
import { ruTypeMap } from '../BusyResourcePage/BusyResourcePage'

interface CellData {
	disciplineId?: string
	discipline?: string
	isOnline?: boolean
	room?: string
	teacherId?: string
}

interface RoomInfo {
	id: string
	title: string
}

interface GridCellProps {
	day: string
	hour: string
	cellData?: CellData

	rooms: RoomInfo[]
	teachers: { id: string; fullName: string }[]
	getBusyPairs: (roomId: string, day: string, hour: string) => ScheduledPair[]
	getBusyPairsTeachers: (
		teacherId: string,
		day: string,
		hour: string
	) => ScheduledPair[]
	placePair: (day: string, hour: string, isOnline: boolean) => void

	removePair: (day: string, hour: string) => void

	setRoom: (day: string, hour: string, room: string) => void

	setTeacher: (day: string, hour: string, teacherId: string) => void
}

const dayCodeMap: Record<
	string,
	'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT'
> = {
	Понедельник: 'MON',
	Вторник: 'TUE',
	Среда: 'WED',
	Четверг: 'THU',
	Пятница: 'FRI',
	Суббота: 'SAT',
}

// из “10:10 — 11:40” → “10:10-11:40”
function normalizeTimeSlotId(display: string): string {
	return display
		.replace(/\s/g, '') // убрать все пробелы
		.replace(/[—–−]/g, '-') // все варианты длинного тире → дефис
}

const GridCell: React.FC<GridCellProps> = memo(props => {
	const {
		day,
		hour,
		cellData,
		rooms,
		teachers,
		getBusyPairs,
		getBusyPairsTeachers,
		placePair,
		removePair,
		setRoom,
		setTeacher,
	} = props

	// console.log(cellData)

	const disciplineLabel = cellData?.discipline || ''
	const roomLabel = cellData?.room || ''
	const isOnline = cellData?.isOnline
	const teacherId = cellData?.teacherId // получаем текущего преподавателя

	// Поиск и выбор кабинета
	const [roomSearch, setRoomSearch] = useState('')
	const filteredRooms = rooms.filter(r =>
		r.title.toLowerCase().includes(roomSearch.toLowerCase())
	)
	const handleRoomSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRoomSearch(e.target.value)
	}

	// Поиск и выбор преподавателя
	const [teacherSearch, setTeacherSearch] = useState('')
	const filteredTeachers = teachers.filter(t =>
		t.fullName.toLowerCase().includes(teacherSearch.toLowerCase())
	)
	const handleTeacherSearchChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setTeacherSearch(e.target.value)
	}

	/** ЛКМ – допустим, ставим офлайн-пару (если выбрана дисциплина). */
	const handleLeftClick = useCallback(() => {
		placePair(day, hour, false)
	}, [day, hour, placePair])

	function makePopoverContent(pairs: ScheduledPair[]) {
		return (
			<List
				className='max-w-[280px]'
				dataSource={pairs}
				renderItem={p => (
					<List.Item key={p.id} className='block'>
						<div className='text-sm grid grid-cols-[110px_1fr] gap-y-1'>
							<span className='font-semibold'>Дисциплина:</span>
							<span>{p.assignment?.discipline ?? '—'}</span>

							<span className='font-semibold'>Тип:</span>
							<span>
								{ruTypeMap[p.assignment?.type ?? ''] ?? p.assignment?.type}
							</span>
							<span className='font-semibold'>Кабинет:</span>
							<span>
								{p.rooms?.length ? p.rooms[0].audience?.title ?? '—' : '—'}
							</span>

							<span className='font-semibold'>Группа:</span>
							<span>{p.groups?.map(g => g.group.title).join(', ') || '—'}</span>

							{p.teachers?.length > 0 && (
								<>
									<span className='font-semibold'>Преподаватель:</span>
									<span>
										{p.teachers
											.map(
												t =>
													`${t.teacher.user.lastName} ${t.teacher.user.firstName}`
											)
											.join(', ')}
									</span>
								</>
							)}
						</div>
					</List.Item>
				)}
				size='small'
				bordered={false}
				split={false}
			/>
		)
	}

	// Контекстное меню
	const menu = (
		<Menu>
			{/* Подменю выбора аудитории (кабинета) */}
			<Menu.SubMenu key='select-room' title='Выбрать кабинет'>
				<Menu.Item key='room-search' disabled>
					<Input
						placeholder='Поиск кабинета...'
						value={roomSearch}
						onChange={handleRoomSearchChange}
						onClick={e => e.stopPropagation()}
						onMouseDown={e => e.stopPropagation()}
					/>
				</Menu.Item>
				{filteredRooms.map(room => {
					const apiDay = dayCodeMap[day] || day
					const apiHour = normalizeTimeSlotId(hour)
					const busyPairs = getBusyPairs(room.id, apiDay, apiHour)
					// console.log(room.id, apiDay, apiHour)
					const busy = busyPairs.length > 0

					return (
						<Menu.Item
							key={room.id}
							onClick={() => setRoom(day, hour, room.title)}
							danger={busy}
						>
							<div className='flex justify-between items-center w-full'>
								{room.title}
								{busy && (
									<Popover
										content={makePopoverContent(busyPairs)}
										placement='right'
										trigger='hover'
									>
										<ExclamationCircleOutlined style={{ marginLeft: 6 }} />
									</Popover>
								)}
							</div>
						</Menu.Item>
					)
				})}
			</Menu.SubMenu>

			<Menu.Divider />

			{/* Подменю выбора преподавателя */}
			<Menu.SubMenu key='select-teacher' title='Выбрать преподавателя'>
				<Menu.Item key='teacher-search' disabled>
					<Input
						placeholder='Поиск преподавателя...'
						value={teacherSearch}
						onChange={handleTeacherSearchChange}
						onClick={e => e.stopPropagation()}
						onMouseDown={e => e.stopPropagation()}
					/>
				</Menu.Item>
				{filteredTeachers.map(t => {
					const apiDay = dayCodeMap[day] || day
					const apiHour = normalizeTimeSlotId(hour)
					// console.log(t.id, apiDay, apiHour)
					const busyPairs = getBusyPairsTeachers(t.id, apiDay, apiHour)
					// console.log(busyPairs)
					const busy = busyPairs.length > 0

					return (
						<Menu.Item
							key={t.id}
							onClick={() => setTeacher(day, hour, t.id)}
							danger={busy}
						>
							<div className='flex justify-between items-center w-full'>
								{t.fullName}
								{busy && (
									<Popover
										content={makePopoverContent(busyPairs)}
										placement='right'
										trigger='hover'
									>
										<ExclamationCircleOutlined style={{ marginLeft: 6 }} />
									</Popover>
								)}
							</div>
						</Menu.Item>
					)
				})}
			</Menu.SubMenu>

			<Menu.Divider />

			<Menu.Item key='set-offline' onClick={() => placePair(day, hour, false)}>
				Поставить офлайн
			</Menu.Item>
			<Menu.Item key='set-online' onClick={() => placePair(day, hour, true)}>
				Поставить онлайн
			</Menu.Item>

			<Menu.Divider />

			<Menu.Item key='remove' onClick={() => removePair(day, hour)}>
				Убрать пару
			</Menu.Item>
		</Menu>
	)

	return (
		<Dropdown overlay={menu} trigger={['contextMenu']}>
			<Card
				style={{
					height: '70px',
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					textAlign: 'center',
					cursor: 'pointer',
				}}
				bodyStyle={{
					padding: 0,
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'start',
					justifyContent: 'center',
					flexDirection: 'column',
					fontSize: '10px',
					textAlign: 'start',
				}}
				className='transition-shadow hover:shadow-md flex flex-col'
				onClick={handleLeftClick}
			>
				{disciplineLabel && <span>{disciplineLabel}</span>}
				{isOnline && disciplineLabel && <span>(онлайн)</span>}
				{/* {disciplineLabel && roomLabel && <span>{' – '}</span>} */}
				{roomLabel && (
					<span>
						<strong>Кабинет</strong> {roomLabel}
					</span>
				)}

				{teacherId && (
					<div>
						<strong>Преподаватель:</strong>{' '}
						{teachers.find(t => t.id === teacherId)?.fullName ?? 'Не выбран'}
					</div>
				)}
			</Card>
		</Dropdown>
	)
})

export default GridCell
