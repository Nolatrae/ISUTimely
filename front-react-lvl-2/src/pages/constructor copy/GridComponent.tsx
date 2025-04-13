'use client'

import audienceService from '@/services/room/audience.service'
import { useQuery } from '@tanstack/react-query'
import { Button, message, Segmented, Table } from 'antd'
import React, { useCallback, useState } from 'react'
import GridCell from './GridCell'
import { daysOfWeek, hoursOfDay } from './const'

// Импортируем zustand (из файла выше)
import { useSelectedPairStore } from '@/store/selectedPairStore'

interface CellData {
	discipline?: string
	room?: string
}

const GridComponent: React.FC = () => {
	// Достаём из Zustand текущую выделенную пару и метод для удаления пары
	const { selectedPair, removePair } = useSelectedPairStore()

	// Допустим, у нас есть сервис аудиторий:
	const {
		data: rooms,
		isLoading,
		error,
	} = useQuery<any[]>({
		queryKey: ['departments'],
		queryFn: () => audienceService.getAll(),
	})
	const roomTitles = rooms?.map(room => room.title) || []

	// Состояние: какая информация заполнена в ячейках.
	// Разделяем четную (even) и нечетную (odd) неделю
	const [selectedCells, setSelectedCells] = useState<{
		even: { [key: string]: CellData }
		odd: { [key: string]: CellData }
	}>({
		even: {},
		odd: {},
	})

	// Переключение чёт/нечёт
	const [isEvenWeek, setIsEvenWeek] = useState(true)

	// Клик по ячейке:
	// Если есть выделенная пара, ставим её в discipline ячейки и сразу удаляем из Zustand
	const handleCellClick = useCallback(
		(day: string, hour: string) => {
			if (selectedPair) {
				const key = `${day}-${hour}`
				const weekKey = isEvenWeek ? 'even' : 'odd'

				setSelectedCells(prev => {
					const updatedCells = { ...prev[weekKey] }
					updatedCells[key] = {
						...updatedCells[key],
						discipline: selectedPair.disciplineName,
					}
					return { ...prev, [weekKey]: updatedCells }
				})

				// Удаляем из общего списка пар
				removePair(selectedPair)
			}
		},
		[selectedPair, isEvenWeek, removePair]
	)

	// Коллбек при выборе кабинета через контекстное меню
	const handleOptionClick = useCallback(
		(
			option: string,
			day: string,
			hour: string,
			type: 'discipline' | 'room'
		) => {
			const key = `${day}-${hour}`
			const weekKey = isEvenWeek ? 'even' : 'odd'
			setSelectedCells(prev => ({
				...prev,
				[weekKey]: {
					...prev[weekKey],
					[key]: {
						...prev[weekKey][key],
						[type]: option, // либо discipline: option, либо room: option
					},
				},
			}))
		},
		[isEvenWeek]
	)

	const handleSegmentedChange = useCallback((val: string | number) => {
		setIsEvenWeek(val === 'even')
	}, [])

	// Условная кнопка "Сохранить" (просто пример)
	const handleSave = useCallback(() => {
		// Здесь можно отправить selectedCells на сервер, etc.
		message.success('Расписание сохранено (пример)')
	}, [])

	const currentWeekKey = isEvenWeek ? 'even' : 'odd'

	// Генерируем колонки для каждой буквы "день недели"
	const columns = [
		{
			title: 'Время',
			dataIndex: 'hour',
			key: 'hour',
			align: 'center' as const,
			width: 100,
		},
		...daysOfWeek.map(day => ({
			title: day,
			dataIndex: day,
			key: day,
			align: 'center' as const,
			width: `${100 / daysOfWeek.length}%`,
			render: (_: any, record: { hour: string }) => {
				const key = `${day}-${record.hour}`
				return (
					<GridCell
						day={day}
						hour={record.hour}
						selectedOption={selectedCells[currentWeekKey]?.[key]}
						onCellClick={handleCellClick}
						onOptionClick={handleOptionClick}
						rooms={roomTitles}
					/>
				)
			},
		})),
	]

	// Строки с временами
	const dataSource = hoursOfDay.map(hour => ({ key: hour, hour }))

	return (
		<div>
			<Segmented
				options={[
					{ label: 'Чётная неделя', value: 'even' },
					{ label: 'Нечётная неделя', value: 'odd' },
				]}
				value={isEvenWeek ? 'even' : 'odd'}
				onChange={handleSegmentedChange}
				className='mb-4 mt-4'
			/>

			<Table
				bordered
				columns={columns}
				dataSource={dataSource}
				pagination={false}
				size='middle'
				className='mb-4'
			/>

			<Button type='primary' onClick={handleSave}>
				Сохранить
			</Button>
		</div>
	)
}

export default GridComponent
