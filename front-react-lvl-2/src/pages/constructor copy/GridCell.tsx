// src/components/GridCell.tsx
import { Card, Dropdown, Input, Menu } from 'antd'
import React, { memo, useCallback, useState } from 'react'

interface CellData {
	discipline?: string
	room?: string
}

interface GridCellProps {
	day: string
	hour: string
	rooms: string[]
	selectedOption?: CellData
	onCellClick: (day: string, hour: string) => void
	onOptionClick: (
		option: string,
		day: string,
		hour: string,
		type: 'discipline' | 'room'
	) => void
}

const GridCell: React.FC<GridCellProps> = memo(
	({ day, hour, rooms, selectedOption, onCellClick, onOptionClick }) => {
		// ЛКМ — если есть выбранная пара, вставим её в дисциплину
		const handleLeftClick = useCallback(() => {
			onCellClick(day, hour)
		}, [day, hour, onCellClick])

		// --- Поиск и выбор комнаты ---
		const [roomSearch, setRoomSearch] = useState('')
		const filteredRooms = rooms.filter(r =>
			r.toLowerCase().includes(roomSearch.toLowerCase())
		)

		const handleRoomSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setRoomSearch(e.target.value)
		}

		const handleRoomClick = useCallback(
			(option: string) => {
				onOptionClick(option, day, hour, 'room')
			},
			[day, hour, onOptionClick]
		)

		// --- Сброс полей ячейки ---
		const handleResetDiscipline = useCallback(() => {
			onOptionClick('', day, hour, 'discipline')
		}, [day, hour, onOptionClick])

		const handleResetRoom = useCallback(() => {
			onOptionClick('', day, hour, 'room')
		}, [day, hour, onOptionClick])

		// Меню (правый клик)
		const menu = (
			<Menu>
				<Menu.SubMenu key='room' title='Выбрать кабинет'>
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
						<Menu.Item key={r} onClick={() => handleRoomClick(r)}>
							{r}
						</Menu.Item>
					))}
				</Menu.SubMenu>

				<Menu.Divider />

				<Menu.Item key='reset-discipline' onClick={handleResetDiscipline}>
					Сбросить дисциплину
				</Menu.Item>
				<Menu.Item key='reset-room' onClick={handleResetRoom}>
					Сбросить кабинет
				</Menu.Item>
			</Menu>
		)

		const disciplineLabel = selectedOption?.discipline || ''
		const roomLabel = selectedOption?.room || ''

		return (
			<Dropdown overlay={menu} trigger={['contextMenu']}>
				<Card
					onClick={handleLeftClick}
					style={{
						height: '70px',
						width: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						textAlign: 'center',
					}}
					bodyStyle={{
						padding: 0,
						width: '100%',
						height: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
					className='transition-shadow hover:shadow-md'
				>
					{disciplineLabel && <span>{disciplineLabel}</span>}
					{disciplineLabel && roomLabel && <span>{' - '}</span>}
					{roomLabel && <span>{roomLabel}</span>}
				</Card>
			</Dropdown>
		)
	}
)

export default GridCell
