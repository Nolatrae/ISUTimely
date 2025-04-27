import audienceService from '@/services/room/audience.service'
import scheduleService, {
	BulkScheduleDto,
	ScheduledPair,
} from '@/services/schedule/schedule.service'
import usersService from '@/services/user/users.service'
import { useSelectedPairStore } from '@/store/selectedPairStore'
import { useQuery } from '@tanstack/react-query'
import { Button, message, Segmented, Table } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import GridCell from './GridCell'
import { daysOfWeek, hoursOfDay } from './const'

/** Что хранится внутри одной ячейки сетки (на конкретный день/время). */
interface CellData {
	disciplineId?: string // Чтобы понимать, какая именно дисциплина заняла слот
	discipline?: string // Название для отображения
	isOnline?: boolean
	room?: string
	teacherId?: string
}

interface GridComponentProps {
	yearOfAdmission: number
	semester: number
	onSemesterChange: (sem: number) => void
	studyPlanId: string
	groupId: string
}

const GridComponent: React.FC<GridComponentProps> = ({
	yearOfAdmission,
	semester,
	onSemesterChange,
	studyPlanId,
	groupId,
}) => {
	const { selectedDiscipline, decrementPair, incrementPair } =
		useSelectedPairStore()

	const [busyPairsByRoom, setBusyPairsByRoom] = useState<
		Record<string /*roomId*/, ScheduledPair[]>
	>({})

	const {
		data: usersData,
		isLoadingUser,
		errorUser,
	} = useQuery<User[]>({
		queryKey: ['users'],
		queryFn: async () => {
			const users = await usersService.getAll()
			return users.map(user => ({
				...user,
				role: user.role || user.rights,
				teacher: user.Teacher,
			}))
		},
	})

	// Подтягиваем список аудиторий (для назначения кабинета)
	const {
		data: rooms = [],
		isLoading,
		error,
	} = useQuery<any[]>({
		queryKey: ['rooms'],
		queryFn: () => audienceService.getAll(),
	})
	const roomTitles = rooms.map(r => r.title)

	const [selectedCells, setSelectedCells] = useState<{
		week1: Record<string, CellData>
		week2: Record<string, CellData>
		week3: Record<string, CellData>
		week4: Record<string, CellData>
	}>({
		week1: {},
		week2: {},
		week3: {},
		week4: {},
	})

	useEffect(() => {
		setSelectedCells({
			week1: {},
			week2: {},
			week3: {},
			week4: {},
		})
	}, [semester])

	// Работаем с неделей 1, 2, 3, 4
	const [week, setWeek] = useState(1)
	const weeks = [1, 2, 3, 4]
	const [startWithOddWeek, setStartWithOddWeek] = useState(true)

	const weekKey = `week${week}` // Используем week вместо even/odd

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

			const key = `${day}-${hour}`
			const oldCell = selectedCells[weekKey]?.[key] // Защищаем от undefined
			const isEditing =
				oldCell && oldCell.disciplineId === selectedDiscipline.id

			if (!isEditing) {
				if (selectedDiscipline.totalPairs <= 0) {
					message.warning('У дисциплины не осталось свободных пар.')
					return
				}
				if (isOnline && selectedDiscipline.onlinePossible <= 0) {
					message.warning('У дисциплины не осталось онлайн-пар.')
					return
				}
			} else {
				if (
					isOnline &&
					!oldCell!.isOnline &&
					selectedDiscipline.onlinePossible <= 0
				) {
					message.warning('У дисциплины не осталось онлайн-пар.')
					return
				}
			}

			// Обновляем состояние ячейки для выбранной недели
			setSelectedCells(prev => {
				const copy = { ...prev[weekKey] }

				// Если ячейка ещё не существует, создаём её
				if (!copy[key]) {
					copy[key] = {
						disciplineId: selectedDiscipline.id,
						discipline: `${selectedDiscipline.disciplineName} (${selectedDiscipline.type})`,
						isOnline,
						room: '',
						teacherId: selectedDiscipline.teacherIds?.[0] ?? undefined,
					}
				} else {
					// Если ячейка уже занята, обновляем её
					copy[key] = {
						...copy[key],
						disciplineId: selectedDiscipline.id,
						discipline: `${selectedDiscipline.disciplineName} (${selectedDiscipline.type})`,
						isOnline,
					}
				}

				return { ...prev, [weekKey]: copy } // Обновляем выбранную неделю
			})

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

	const setTeacher = useCallback(
		(day: string, hour: string, teacherId: string) => {
			const key = `${day}-${hour}`
			setSelectedCells(prev => {
				const copy = { ...prev[weekKey] }
				const cellData = copy[key] || {}
				copy[key] = { ...cellData, teacherId }
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
				const cellData = selectedCells[weekKey]?.[key] // Защищаем от undefined

				return (
					<GridCell
						day={day}
						hour={record.hour}
						cellData={cellData}
						teachers={
							usersData?.map(user => ({
								id: user.teacher?.id,
								fullName: `${user.lastName} ${user.firstName} ${user.middleName}`,
							})) ?? []
						}
						rooms={rooms}
						getBusyPairs={getBusyPairs}
						placePair={placePair}
						removePair={removePair}
						setRoom={setRoom}
						setTeacher={setTeacher}
					/>
				)
			},
		})),
	]

	// Формируем строки по временам
	const dataSource = hoursOfDay.map(hour => ({ key: hour, hour }))

	const halfIndex = semester + 1
	const displayYear = yearOfAdmission + Math.floor((halfIndex - 1) / 2)
	const halfNumber = halfIndex % 2 === 0 ? 2 : 1
	const halfYearCode = `${displayYear}H${halfNumber}`

	const typeMap: Record<string, 'lecture' | 'practice'> = {
		Лекция: 'lecture',
		Практика: 'practice',
	}

	const handleSave = useCallback(async () => {
		// Инициализация объекта scheduleDto для всех недель
		const scheduleDto = { week1: {}, week2: {}, week3: {}, week4: {} }

		// Логируем начальный объект, который будем отправлять на сервер
		console.log('Начальное состояние scheduleDto:', scheduleDto)

		// Функция для поиска roomId по названию
		function findRoomIdByTitle(title: string): string | undefined {
			return rooms.find(r => r.title === title)?.id
		}

		// Заполняем расписание для каждой недели
		for (let i = 1; i <= 4; i++) {
			const weekKey = `week${i}`

			for (const [key, cell] of Object.entries(selectedCells[weekKey])) {
				const disciplineStr = cell.discipline!
				const typeMatch = disciplineStr.match(/\((Лекция|Практика)\)/)
				if (!typeMatch) return

				const typeKey = typeMatch[1]
				const disciplineName = disciplineStr.slice(0, typeMatch.index).trim()

				// Заполняем расписание для каждой ячейки
				scheduleDto[weekKey][key] = {
					disciplineName,
					type: typeMap[typeKey],
					isOnline: cell.isOnline!,
					...(cell.room ? { roomId: findRoomIdByTitle(cell.room)! } : {}),
					...(cell.teacherId ? { teacherIds: [cell.teacherId] } : {}),
				}
			}
		}

		// 2. Конструируем полный BulkScheduleDto
		const payload: BulkScheduleDto = {
			studyPlanId,
			groupId,
			halfYear: halfYearCode,
			schedule: scheduleDto,
		}

		// Логируем объект payload перед отправкой
		console.log('Payload, который отправляется на сервер:', payload)

		// Отправляем данные на сервер
		try {
			await scheduleService.bulkCreateDistance(payload)
			message.success('Расписание сохранено на сервере')
		} catch {
			message.error('Ошибка при сохранении расписания')
		}
	}, [selectedCells, halfYearCode, groupId, studyPlanId, typeMap, rooms])

	useEffect(() => {
		if (!rooms.length) return

		let cancelled = false
		;(async () => {
			const entries = await Promise.all(
				rooms.map(async r => {
					const pairs = await scheduleService.getBusyRoomRecords(
						r.id,
						halfYearCode
					)
					return [r.id, pairs] as const
				})
			)
			if (!cancelled) setBusyPairsByRoom(Object.fromEntries(entries))
		})()

		return () => {
			cancelled = true
		}
	}, [rooms, halfYearCode])

	const getBusyPairs = useCallback(
		(roomId: string, day: string, hour: string): ScheduledPair[] => {
			const all = busyPairsByRoom[roomId] ?? []

			// В зависимости от того, с какой недели начинаем
			const weekType = startWithOddWeek
				? week % 2 === 0
					? 'EVEN'
					: 'ODD'
				: week % 2 === 0
				? 'ODD'
				: 'EVEN'

			return all.filter(
				p =>
					p.weekType === weekType &&
					p.dayOfWeek === day &&
					p.timeSlotId === hour
			)
		},
		[busyPairsByRoom, week, startWithOddWeek]
	)

	return (
		<div>
			<div className='flex gap-4 mb-4'>
				<span className='font-medium content-center'>
					{displayYear} − {halfNumber} полугодие
				</span>
				<Segmented
					options={[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
						label: `${n}`,
						value: n,
					}))}
					value={semester}
					onChange={val => onSemesterChange(val as number)}
				/>
				<Segmented
					options={weeks.map(w => ({ label: `${w}`, value: w }))}
					value={week}
					onChange={setWeek}
				/>
				<Segmented
					options={[
						{ label: 'Начать с нечётной', value: true },
						{ label: 'Начать с чётной', value: false },
					]}
					value={startWithOddWeek}
					onChange={setStartWithOddWeek}
				/>
			</div>

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
