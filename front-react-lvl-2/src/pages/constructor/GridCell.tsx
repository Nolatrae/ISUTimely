import { Card, Dropdown, Input, Menu } from 'antd'
import React, { memo, useCallback, useState } from 'react'

interface CellData {
	disciplineId?: string
	discipline?: string
	isOnline?: boolean
	room?: string
	teacherId?: string // Добавляем id преподавателя
}

interface GridCellProps {
	day: string
	hour: string
	cellData?: CellData

	rooms: string[]
	teachers: { id: string; fullName: string }[] // Преподаватели для выбора

	// Клик (ЛКМ или из контекстного меню) — постановка пары
	placePair: (day: string, hour: string, isOnline: boolean) => void

	// Удаление пары из ячейки
	removePair: (day: string, hour: string) => void

	// Установка аудитории
	setRoom: (day: string, hour: string, room: string) => void

	// Установка преподавателя
	setTeacher: (day: string, hour: string, teacherId: string) => void
}

const GridCell: React.FC<GridCellProps> = memo(props => {
	const {
		day,
		hour,
		cellData,
		rooms,
		teachers,
		placePair,
		removePair,
		setRoom,
		setTeacher,
	} = props

	const disciplineLabel = cellData?.discipline || ''
	const roomLabel = cellData?.room || ''
	const isOnline = cellData?.isOnline
	const teacherId = cellData?.teacherId // получаем текущего преподавателя

	// Поиск и выбор кабинета
	const [roomSearch, setRoomSearch] = useState('')
	const filteredRooms = rooms.filter(r =>
		r.toLowerCase().includes(roomSearch.toLowerCase())
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
				{filteredRooms.map(r => (
					<Menu.Item key={r} onClick={() => setRoom(day, hour, r)}>
						{r}
					</Menu.Item>
				))}
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
				{filteredTeachers.map(t => (
					<Menu.Item key={t.id} onClick={() => setTeacher(day, hour, t.id)}>
						{t.fullName}
					</Menu.Item>
				))}
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
