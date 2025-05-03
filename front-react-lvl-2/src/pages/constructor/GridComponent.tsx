import audienceService from '@/services/room/audience.service'
import scheduleService, {
	BulkScheduleDto,
	ScheduledPair,
} from '@/services/schedule/schedule.service'
import usersService from '@/services/user/users.service'
import { useSelectedPairStore } from '@/store/selectedPairStore'
import { useQuery } from '@tanstack/react-query'
import { Button, message, Segmented, Table } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
	const [busyPairsByTeacher, setBusyPairsByTeacher] = useState<
		Record<string /*teacherId*/, ScheduledPair[]>
	>({})

	// console.log(selectedDiscipline)

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

	const teachers = useMemo(() => {
		return (
			usersData
				?.filter(user => user.role.includes('TEACHER'))
				.map(user => ({
					id: user.teacher?.id,
					fullName: `${user.firstName} ${user.middleName || ''} ${
						user.lastName
					}`,
				})) ?? []
		)
	}, [usersData])

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

	// Храним отдельный объект с отмеченными ячейками для чётной и нечётной недели
	const [selectedCells, setSelectedCells] = useState<{
		even: Record<string, CellData>
		odd: Record<string, CellData>
	}>({
		even: {},
		odd: {},
	})

	useEffect(() => {
		setSelectedCells({ even: {}, odd: {} })
	}, [semester])

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

			// console.log(selectedDiscipline)
			// console.log(isOnline, selectedDiscipline.onlinePossible)

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
					room: '',
					teacherId: selectedDiscipline.teacherIds?.[0] ?? undefined,
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
				const cellData = selectedCells[weekKey][key]

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
						getBusyPairsTeachers={getBusyPairsTeachers}
						placePair={placePair}
						removePair={removePair}
						setRoom={setRoom}
						setTeacher={setTeacher} // Передаем setTeacher
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
		const scheduleDto: BulkScheduleDto['schedule'] = { even: {}, odd: {} }

		function findRoomIdByTitle(title: string): string | undefined {
			return rooms.find(r => r.title === title)?.id
		}

		for (const [key, cell] of Object.entries(selectedCells.even)) {
			const disciplineStr = cell.discipline!
			const typeMatch = disciplineStr.match(/\((Лекция|Практика)\)/)
			if (!typeMatch) return

			const typeKey = typeMatch[1]
			const disciplineName = disciplineStr.slice(0, typeMatch.index).trim()

			scheduleDto.even[key] = {
				disciplineName,
				type: typeMap[typeKey],
				isOnline: cell.isOnline!,
				...(cell.room ? { roomId: findRoomIdByTitle(cell.room)! } : {}),
				...(cell.teacherId ? { teacherIds: [cell.teacherId] } : {}),
			}
		}

		// console.log(selectedCells.odd)

		for (const [key, cell] of Object.entries(selectedCells.odd)) {
			const [name, typeLabel] = cell.discipline!.split('(')
			const disciplineName = name.trim()
			const typeKey = typeLabel.replace(')', '').trim()
			// console.log(typeKey)
			scheduleDto.odd[key] = {
				disciplineName,
				type: typeMap[typeKey],
				isOnline: cell.isOnline!,
				...(cell.room ? { roomId: findRoomIdByTitle(cell.room)! } : {}),
				...(cell.teacherId ? { teacherIds: [cell.teacherId] } : {}),
			}
		}

		// 2. Конструируем полный BulkScheduleDto
		const payload: BulkScheduleDto = {
			studyPlanId,
			groupId,
			halfYear: halfYearCode,
			schedule: scheduleDto,
		}

		// 3. Вызываем сервис
		try {
			await scheduleService.bulkCreate(payload)
			message.success('Расписание сохранено на сервере')
		} catch {
			message.error('Ошибка при сохранении расписания')
		}
	}, [selectedCells, halfYearCode, groupId, studyPlanId, typeMap])

	useEffect(() => {
		console.log('room')
		if (!rooms.length) return
		console.log(rooms)

		let cancelled = false
		;(async () => {
			const entries = await Promise.all(
				rooms.map(async r => {
					const pairs = await scheduleService.getBusyRoomRecords(
						r.id,
						halfYearCode
					)
					// console.log(r.id, pairs)
					return [r.id, pairs] as const
				})
			)
			if (!cancelled) setBusyPairsByRoom(Object.fromEntries(entries))
		})()

		return () => {
			cancelled = true
		}
	}, [rooms, halfYearCode])

	useEffect(() => {
		if (!teachers?.length) return

		let cancelled = false
		;(async () => {
			const entries = await Promise.all(
				teachers.map(async user => {
					const pairs = await scheduleService.getBusyTeacherRecords(
						user.id,
						halfYearCode
					)
					return [user.id, pairs] as const
				})
			)

			if (!cancelled) {
				const filteredEntries = entries.filter(entry => entry !== null)
				setBusyPairsByTeacher(
					Object.fromEntries(filteredEntries as [string, ScheduledPair[]][])
				)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [teachers, halfYearCode])

	const getBusyPairs = useCallback(
		(roomId: string, day: string, hour: string): ScheduledPair[] => {
			const all = busyPairsByRoom[roomId] ?? []
			const wk = isEvenWeek ? 'EVEN' : 'ODD'
			return all.filter(
				p => p.weekType === wk && p.dayOfWeek === day && p.timeSlotId === hour
			)
		},
		[busyPairsByRoom, isEvenWeek]
	)

	const getBusyPairsTeachers = useCallback(
		(teacherId: string, day: string, hour: string): ScheduledPair[] => {
			const all = busyPairsByTeacher[teacherId] ?? []
			const wk = isEvenWeek ? 'EVEN' : 'ODD'
			return all.filter(
				p => p.weekType === wk && p.dayOfWeek === day && p.timeSlotId === hour
			)
		},
		[busyPairsByTeacher, isEvenWeek]
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
					options={[
						{ label: 'Чётная неделя', value: 'even' },
						{ label: 'Нечётная неделя', value: 'odd' },
					]}
					value={isEvenWeek ? 'even' : 'odd'}
					onChange={handleSegmentedChange}
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
