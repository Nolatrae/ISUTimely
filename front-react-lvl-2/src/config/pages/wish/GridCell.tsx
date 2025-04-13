import { Card, Dropdown, Input, Menu } from 'antd'
import React, { memo, useCallback, useState } from 'react'

interface GridCellProps {
  day: string
  hour: string
  disciplines: string[]
  rooms: string[]
  selectedOption?: {
    discipline?: string
    room?: string
  }
  onCellClick: (day: string, hour: string) => void
  onOptionClick: (
    option: string,
    day: string,
    hour: string,
    type: 'discipline' | 'room'
  ) => void
}

const GridCell: React.FC<GridCellProps> = memo(
  ({
    day,
    hour,
    disciplines,
    rooms,
    selectedOption,
    onCellClick,
    onOptionClick,
  }) => {
    // ЛКМ — выбор ячейки
    const handleLeftClick = useCallback(() => {
      onCellClick(day, hour)
    }, [day, hour, onCellClick])

    // Выбор дисциплины
    const handleDisciplineClick = useCallback(
      (option: string) => {
        onOptionClick(option, day, hour, 'discipline')
      },
      [day, hour, onOptionClick]
    )

    // Выбор комнаты
    const handleRoomClick = useCallback(
      (option: string) => {
        onOptionClick(option, day, hour, 'room')
      },
      [day, hour, onOptionClick]
    )

    // --- Поиск для дисциплин ---
    const [disciplineSearch, setDisciplineSearch] = useState('')
    const filteredDisciplines = disciplines.filter(d =>
      d.toLowerCase().includes(disciplineSearch.toLowerCase())
    )

    const handleDisciplineSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisciplineSearch(e.target.value)
    }

    // --- Поиск для кабинетов ---
    const [roomSearch, setRoomSearch] = useState('')
    const filteredRooms = rooms.filter(r =>
      r.toLowerCase().includes(roomSearch.toLowerCase())
    )

    const handleRoomSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setRoomSearch(e.target.value)
    }

    // Контекстное меню
    const menu = (
      <Menu>
        {/* Меню для выбора дисциплины */}
        <Menu.SubMenu key='discipline' title='Выбрать дисциплину'>
          <Menu.Item key='discipline-search' disabled>
            <Input
              placeholder='Поиск дисциплины...'
              value={disciplineSearch}
              onChange={handleDisciplineSearchChange}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            />
          </Menu.Item>
          {filteredDisciplines.map(d => (
            <Menu.Item key={d} onClick={() => handleDisciplineClick(d)}>
              {d}
            </Menu.Item>
          ))}
        </Menu.SubMenu>

        {/* Меню для выбора кабинета */}
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
      </Menu>
    )

    return (
			<Dropdown overlay={menu} trigger={['contextMenu']}>
			<Card
				onClick={handleLeftClick}
				style={{
					height: '70px', // Фиксированная высота
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					textAlign: 'center',
				}}
				bodyStyle={{
					padding: 0, // Убираем лишние отступы
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				className="transition-shadow hover:shadow-md"
			>
				{selectedOption && (
					<>
						{selectedOption?.discipline ?? 'Выбран'} {selectedOption?.room && `- ${selectedOption.room}`}
					</>
				)}
			</Card>
		</Dropdown>
    )
  }
)

export default GridCell
