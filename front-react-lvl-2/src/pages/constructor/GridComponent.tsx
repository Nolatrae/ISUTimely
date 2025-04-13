import audienceService from '@/services/room/audience.service'
import { useSelectedPairStore } from '@/store/selectedPairStore'
import { useQuery } from '@tanstack/react-query'
import { Button, message, Segmented, Table } from 'antd'
import React, { useCallback, useState } from 'react'
import GridCell from './GridCell'
import { daysOfWeek, hoursOfDay } from './const'

/** Что хранится внутри одной ячейки сетки (на конкретный день/время). */
interface CellData {
	disciplineId?: string // Чтобы понимать, какая именно дисциплина заняла слот
	discipline?: string // Название для отображения
	isOnline?: boolean
	room?: string
}

const GridComponent: React.FC = () => {
	const { selectedDiscipline, decrementPair, incrementPair } =
		useSelectedPairStore()

	console.log(selectedDiscipline)

	// Подтягиваем список аудиторий (для назначения кабинета)
	const {
		data: rooms = [],
		isLoading,
		error,
	} = useQuery<any[]>({
		queryKey: ['departments'],
		queryFn: () => audienceService.getAll(),
	})
	const roomTitles = rooms.map(r => r.title)

	// Храним отдельный объект с отмеченными ячейками для чётной и нечётной недели
	const [selectedCells, setSelectedCells] = useState<{
		even: Record<string, CellData>
		odd: Record<string, CellData>
	}>({
		even: {},
		odd: {},
	})

	// Чётная или нечётная неделя
	const [isEvenWeek, setIsEvenWeek] = useState(true)

	const handleSegmentedChange = useCallback((val: string | number) => {
		setIsEvenWeek(val === 'even')
	}, [])

	const weekKey = isEvenWeek ? 'even' : 'odd'

	/**
	 * Функция для «поставить пару»: вызывается при клике
	 * (через контекстное меню или левый клик). isOnline определяем по ситуации.
	 */
	const placePair = useCallback(
		(day: string, hour: string, isOnline: boolean) => {
			if (!selectedDiscipline) {
				message.info('Сначала выберите дисциплину слева.')
				return
			}

			// Проверяем, остались ли пары (и онлайн-пары, если надо)

			console.log(selectedDiscipline)
			console.log(isOnline, selectedDiscipline.onlinePossible)

			const key = `${day}-${hour}`
			const oldCell = selectedCells[weekKey][key]
			const isEditing =
				oldCell && oldCell.disciplineId === selectedDiscipline.id

			if (!isEditing) {
				// Если пара ставится впервые, проверяем наличие свободной пары и (для онлайн) свободной онлайн-пары
				if (selectedDiscipline.totalPairs <= 0) {
					message.warning('У дисциплины не осталось свободных пар.')
					return
				}
				if (isOnline && selectedDiscipline.onlinePossible <= 0) {
					message.warning('У дисциплины не осталось онлайн-пар.')
					return
				}
			} else {
				// Редактирование уже вставленной пары
				// При конверсии с офлайн в онлайн проверяем наличие online-пар
				if (
					isOnline &&
					!oldCell!.isOnline &&
					selectedDiscipline.onlinePossible <= 0
				) {
					message.warning('У дисциплины не осталось онлайн-пар.')
					return
				}
				// Для других вариантов редактирования (например, онлайн → офлайн или без изменения типа)
				// не требуется дополнительно проверять свободные пары
			}

			// Обновляем состояние ячейки расписания
			setSelectedCells(prev => {
				const copy = { ...prev[weekKey] }

				// Если ячейка уже занята выбранной дисциплиной
				// и мы изменяем тип пары, возвращаем старую пару в счетчики
				if (isEditing && oldCell && oldCell.isOnline !== isOnline) {
					incrementPair(oldCell.disciplineId, oldCell.isOnline)
				}

				copy[key] = {
					disciplineId: selectedDiscipline.id,
					discipline: `${selectedDiscipline.disciplineName} (${selectedDiscipline.type})`,
					isOnline,
					room: '', // пока оставляем пустым, можно назначить позже
				}

				return { ...prev, [weekKey]: copy }
			})

			// Обновляем состояние дисциплины: уменьшаем нужный счётчик согласно новому назначению
			decrementPair(selectedDiscipline.id, isOnline)
		},
		[selectedDiscipline, decrementPair, incrementPair, weekKey]
	)

	/**
	 * Удаление пары из ячейки: возвращаем пару в store (incrementPair).
	 */
	const removePair = useCallback(
		(day: string, hour: string) => {
			const key = `${day}-${hour}`
			setSelectedCells(prev => {
				const cellData = prev[weekKey][key]
				if (cellData && cellData.disciplineId) {
					// Возвращаем пары в store
					incrementPair(cellData.disciplineId, !!cellData.isOnline)
				}
				const copy = { ...prev[weekKey] }
				delete copy[key]
				return { ...prev, [weekKey]: copy }
			})
		},
		[weekKey, incrementPair]
	)

	/**
	 * Установка кабинета (room) в ячейку (например, из контекстного меню).
	 */
	const setRoom = useCallback(
		(day: string, hour: string, room: string) => {
			const key = `${day}-${hour}`
			setSelectedCells(prev => {
				const copy = { ...prev[weekKey] }
				const cellData = copy[key] || {}
				copy[key] = { ...cellData, room }
				return { ...prev, [weekKey]: copy }
			})
		},
		[weekKey]
	)

	// Определяем колонки для таблицы
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
			render: (_: any, record: { hour: string }) => {
				const key = `${day}-${record.hour}`
				const cellData = selectedCells[weekKey][key]
				return (
					<GridCell
						day={day}
						hour={record.hour}
						cellData={cellData}
						rooms={roomTitles}
						placePair={placePair}
						removePair={removePair}
						setRoom={setRoom}
					/>
				)
			},
		})),
	]

	// Формируем строки по временам
	const dataSource = hoursOfDay.map(hour => ({ key: hour, hour }))

	// Условная кнопка «Сохранить»
	const handleSave = useCallback(() => {
		console.log('Сохранение расписания:', selectedCells)
		message.success('Расписание сохранено (пример)')
	}, [selectedCells])

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
