import { disciplineService } from '@/services/disciplines/discipline.service'
import { useSelectedPairStore } from '@/store/selectedPairStore'
import { useQuery } from '@tanstack/react-query'
import { Card, Collapse, List, Splitter } from 'antd'
import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import wishesService from '@/services/wishes/wishes.service'
import GridComponent from './GridComponent'

import styles from './style.module.scss'

/**
 * Вспомогательная функция для перевода часов в количество пар
 * с вашим порогом 17 ч/пара и округлением до ближайшего целого.
 */
function roundPairs(value: number, hoursPerPair = 17) {
	const raw = value / hoursPerPair
	const fraction = raw - Math.floor(raw)
	return fraction >= 0.5 ? Math.ceil(raw) : Math.floor(raw)
}

export function Constructor() {
	// Пример: айди учебного плана
	const studyPlanId = 'cm8vhkh5p0013fbt8u1m4wcfc'

	// Zustand store
	const { disciplines, selectedDiscipline, setDisciplines, toggleDiscipline } =
		useSelectedPairStore()

	// Запрос дисциплин
	const {
		data: disciplinesData = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['disciplines', studyPlanId],
		queryFn: () =>
			studyPlanId ? disciplineService.getDisciplines(studyPlanId) : [],
		enabled: !!studyPlanId,
	})

	// Запрос пожеланий всех преподавателей
	const {
		data: wishesResponse = [],
		isLoading: isLoadingWishes,
		error: errorWishes,
	} = useQuery({
		queryKey: ['allTeacherWishes'],
		queryFn: () => wishesService.getAllWishes().then(res => res.data),
	})

	// Группировка пожеланий по преподавателю
	const groupedWishes = wishesResponse.reduce((acc: any, wish: any) => {
		const teacherId = wish.teacher?.id || wish.teacherId
		if (!acc[teacherId]) {
			acc[teacherId] = {
				teacher: wish.teacher,
				schedule: [],
				text: null,
			}
		}
		if (wish.type === 'text') {
			acc[teacherId].text = wish.content
		} else if (wish.type === 'schedule') {
			acc[teacherId].schedule.push(wish)
		}
		return acc
	}, {})
	const teacherWishesArray = Object.values(groupedWishes)

	// Когда дисциплины загружены, собираем единый список «Лекция/Практика/Лабораторная» с общим числом пар и доступным онлайн
	useEffect(() => {
		if (!disciplinesData.length) return

		const generated = disciplinesData
			// К примеру, фильтруем по первому семестру (как было в примере)
			.filter(d => d.semester === 1)
			.flatMap(d => {
				const {
					name,
					lecture_hours,
					practice_hours,
					laboratory_hours,
					el_lecture_hours,
					el_practice_hours,
					el_laboratory_hours,
				} = d

				const items = []

				// ЛЕКЦИИ: Объединяем lecture_hours + el_lecture_hours
				const totalLectures = roundPairs(
					(lecture_hours ?? 0) + (el_lecture_hours ?? 0)
				)
				if (totalLectures > 0) {
					items.push({
						id: uuidv4(),
						disciplineName: name,
						type: 'Лекция',
						totalPairs: totalLectures,
						onlinePossible: roundPairs(el_lecture_hours ?? 0),
					})
				}

				// ПРАКТИКИ
				const totalPractices = roundPairs(
					(practice_hours ?? 0) + (el_practice_hours ?? 0)
				)
				if (totalPractices > 0) {
					items.push({
						id: uuidv4(),
						disciplineName: name,
						type: 'Практика',
						totalPairs: totalPractices,
						onlinePossible: roundPairs(el_practice_hours ?? 0),
					})
				}

				// ЛАБОРАТОРНЫЕ
				const totalLabs = roundPairs(
					(laboratory_hours ?? 0) + (el_laboratory_hours ?? 0)
				)
				if (totalLabs > 0) {
					items.push({
						id: uuidv4(),
						disciplineName: name,
						type: 'Лабораторная',
						totalPairs: totalLabs,
						onlinePossible: roundPairs(el_laboratory_hours ?? 0),
					})
				}

				return items
			})

		setDisciplines(generated)
	}, [disciplinesData, setDisciplines])

	return (
		<div className='h-screen'>
			<Splitter
				className={styles.container}
				style={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}
			>
				{/* Панель 1: список дисциплин */}
				<Splitter.Panel collapsible>
					<div className='h-full overflow-auto p-4'>
						{isLoading && <p>Загрузка...</p>}
						{error && <p style={{ color: 'red' }}>Ошибка загрузки данных</p>}

						{!isLoading &&
							!error &&
							disciplines.map(disc => {
								const isActive = selectedDiscipline?.id === disc.id
								return (
									<Card
										key={disc.id}
										className='mb-4'
										title={`${disc.disciplineName} — ${disc.type}`}
										style={{
											border: isActive ? '2px solid #1677ff' : undefined,
											cursor: 'pointer',
										}}
										onClick={() => toggleDiscipline(disc)}
									>
										<p>Осталось пар: {disc.totalPairs}</p>
										<p>Можно онлайн: {disc.onlinePossible}</p>
									</Card>
								)
							})}
					</div>
				</Splitter.Panel>

				{/* Панель 2: расписание */}
				<Splitter.Panel collapsible={{ start: true }}>
					<div className='h-full overflow-auto p-4'>
						<GridComponent />
					</div>
				</Splitter.Panel>

				{/* Панель 3: пожелания преподавателей */}
				<Splitter.Panel>
					<div className='h-full overflow-auto p-4'>
						<h3>Пожелания всех преподавателей</h3>
						{isLoadingWishes && <p>Загрузка пожеланий...</p>}
						{errorWishes && (
							<p style={{ color: 'red' }}>Ошибка загрузки пожеланий</p>
						)}
						{!isLoadingWishes && !errorWishes && (
							<List
								bordered
								dataSource={teacherWishesArray}
								renderItem={(item: any) => (
									<List.Item>
										<div>
											<p>
												Преподаватель:{' '}
												{item.teacher?.userId || item.teacherId || 'Неизвестно'}
											</p>
											{item.schedule && item.schedule.length > 0 && (
												<div>
													<p>Расписание:</p>
													<List
														bordered
														dataSource={item.schedule}
														renderItem={(wish: any) => (
															<List.Item>
																<p>
																	{wish.day} – {wish.timeSlot}
																	{wish.discipline
																		? ` (${wish.discipline})`
																		: ''}
																	{wish.room ? ` в ауд. ${wish.room}` : ''}
																</p>
															</List.Item>
														)}
													/>
												</div>
											)}
											{item.text && (
												<Collapse>
													<Collapse.Panel header='Текстовое пожелание'>
														<p>{item.text}</p>
													</Collapse.Panel>
												</Collapse>
											)}
										</div>
									</List.Item>
								)}
							/>
						)}
					</div>
				</Splitter.Panel>
			</Splitter>
		</div>
	)
}
