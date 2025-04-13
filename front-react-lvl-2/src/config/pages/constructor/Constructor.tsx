import { disciplineService } from '@/services/disciplines/discipline.service'
import { useSelectedPairStore } from '@/store/selectedPairStore'
import { useQuery } from '@tanstack/react-query'
import { Card, Collapse, List, Splitter } from 'antd'
import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import wishesService from '@/services/wishes/wishes.service'
import GridComponent from './GridComponent'

import styles from './style.module.scss'

export function Constructor() {
	const studyPlanId = 'cm8vhkh5p0013fbt8u1m4wcfc'

	const { pairs, selectedPair, setPairs, togglePair } = useSelectedPairStore()

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
	const groupedWishes = wishesResponse.reduce((acc, wish) => {
		// Получаем идентификатор преподавателя
		const teacherId = wish.teacher?.id || wish.teacherId
		if (!acc[teacherId]) {
			acc[teacherId] = {
				teacher: wish.teacher,
				schedule: [],
				text: null,
			}
		}
		// Если пожелание текстовое – запоминаем его (при наличии, перезаписывается, но обычно их один)
		if (wish.type === 'text') {
			acc[teacherId].text = wish.content
		} else if (wish.type === 'schedule') {
			acc[teacherId].schedule.push(wish)
		}
		return acc
	}, {} as Record<string, { teacher: any; schedule: any[]; text: string | null }>)

	const teacherWishesArray = Object.values(groupedWishes)

	// Генерация пар при загрузке данных
	useEffect(() => {
		if (!disciplinesData.length) return

		const roundPairs = (value: number, hoursPerPair = 17) => {
			const raw = value / hoursPerPair
			const fraction = raw - Math.floor(raw)
			return fraction >= 0.5 ? Math.ceil(raw) : Math.floor(raw)
		}

		const generatedPairs = disciplinesData
			.filter(d => d.semester === 1)
			.flatMap(discipline => {
				const {
					name,
					lecture_hours,
					practice_hours,
					laboratory_hours,
					el_lecture_hours,
					el_practice_hours,
					el_laboratory_hours,
				} = discipline

				const result: {
					id: string
					disciplineName: string
					type: string
					pairNumber: number
				}[] = []

				const pushPairs = (count: number, type: string) => {
					for (let i = 1; i <= count; i++) {
						result.push({
							id: uuidv4(),
							disciplineName: name,
							type,
							pairNumber: i,
						})
					}
				}

				if (lecture_hours) pushPairs(roundPairs(lecture_hours), 'Лекция')
				if (practice_hours) pushPairs(roundPairs(practice_hours), 'Практика')
				if (laboratory_hours)
					pushPairs(roundPairs(laboratory_hours), 'Лабораторная')
				if (el_lecture_hours)
					pushPairs(roundPairs(el_lecture_hours), 'Электронная лекция')
				if (el_practice_hours)
					pushPairs(roundPairs(el_practice_hours), 'Электронная практика')
				if (el_laboratory_hours)
					pushPairs(roundPairs(el_laboratory_hours), 'Электронная лабораторная')

				return result
			})

		setPairs(generatedPairs)
	}, [disciplinesData, setPairs])

	return (
		<div className='h-screen'>
			<Splitter
				className={styles.container}
				style={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}
			>
				{/* Панель 1: список пар */}
				<Splitter.Panel collapsible>
					<div className='h-full overflow-auto p-4'>
						{isLoading && <p>Загрузка...</p>}
						{error && <p style={{ color: 'red' }}>Ошибка загрузки данных</p>}
						{!isLoading &&
							!error &&
							pairs.map(pair => {
								const isActive = selectedPair?.id === pair.id

								return (
									<Card
										className='p-1'
										key={pair.id}
										title={pair.disciplineName}
										style={{
											marginBottom: 16,
											border: isActive ? '2px solid #1677ff' : undefined,
											cursor: 'pointer',
										}}
										onClick={() => togglePair(pair)}
									>
										<p>Тип: {pair.type}</p>
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

				{/* Панель 3: зарезервирована под доп. функционал */}
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
																	{wish.day} - {wish.timeSlot} (
																	{wish.discipline ?? '—'})
																	{wish.room ? ` в аудитории ${wish.room}` : ''}
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
