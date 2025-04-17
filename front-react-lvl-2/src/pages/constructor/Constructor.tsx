import { disciplineService } from '@/services/disciplines/discipline.service'
import { useSelectedPairStore } from '@/store/selectedPairStore'
import { useQuery } from '@tanstack/react-query'
import { Card, Splitter } from 'antd'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import wishesService from '@/services/wishes/wishes.service'
import GridComponent from './GridComponent'

import usersService from '@/services/user/users.service'
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

const typeMap: Record<string, string> = {
	Лекция: 'lecture',
	Практика: 'practice',
	Лабораторная: 'lab',
}
export function Constructor({
	yearOfAdmission = 2021,
}: {
	yearOfAdmission: number
}) {
	// Пример: айди учебного плана
	const studyPlanId = 'cm8vhkh5p0013fbt8u1m4wcfc'
	const [selectedSemester, setSelectedSemester] = useState<number>(1)

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

	const {
		data: usersData,
		isUserLoading,
		isUserError,
	} = useQuery<any[]>({
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

	const {
		data: disciplinesWishesAll,
		isLoading: isDisciplineLoadingAll,
		error: disciplineErrorAll,
	} = useQuery({
		queryKey: ['disciplines'],
		queryFn: () => disciplineService.getAllTeacherPairs(),
	})

	console.log(disciplinesWishesAll)

	// console.log(usersData)

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
		if (!disciplinesData.length || !disciplinesWishesAll) return

		const generated = disciplinesData
			// К примеру, фильтруем по первому семестру (как было в примере)
			.filter(d => d.semester === selectedSemester)
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

		// Привязываем teacherIds к каждой «пистой» дисциплине
		const withTeachers = generated.map(item => {
			const mp = disciplinesWishesAll.find(
				p =>
					p.discipline === item.disciplineName &&
					p.type.toLowerCase() === typeMap[item.type]
			)
			return {
				...item,
				teacherIds: mp?.teachers.map(t => t.id) ?? [],
			}
		})

		setDisciplines(withTeachers)
	}, [disciplinesData, disciplinesWishesAll, selectedSemester, setDisciplines])

	console.log(disciplines)

	// Запрос на получение дисциплин
	const {
		data: disciplinesWishes,
		isLoading: isDisciplineLoading,
		error: disciplineError,
	} = useQuery({
		queryKey: ['disciplines'],
		queryFn: () =>
			disciplineService.getTeacherPairs('f59fa491-baa0-4af8-8588-4b213ffafc05'),
	})

	const {
		data: disciplinesText,
		isLoading: isTextLoading,
		error: textError,
	} = useQuery({
		queryKey: ['text'],
		queryFn: () =>
			disciplineService.getTeacherText('f59fa491-baa0-4af8-8588-4b213ffafc05'),
	})

	return (
		<div className='h-screen'>
			<div></div>
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

								const matchedPair = disciplinesWishesAll?.find(pair => {
									return (
										pair.discipline === disc.disciplineName &&
										pair.type.toLowerCase() === typeMap[disc.type]
									)
								})

								// 2. Из matchedPair достаём массив teachers
								const teacherNames =
									matchedPair?.teachers?.map(t => {
										const { lastName, firstName, middleName } = t.user
										return `${lastName} ${firstName} ${middleName ?? ''}`.trim()
									}) ?? []

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

										{/* 3. Если в matchedPair есть учителя, выводим их ID: */}
										{teacherNames.length > 0 && (
											<p>
												Преподаватели:
												<br />
												{teacherNames.join(', ')}
											</p>
										)}
									</Card>
								)
							})}
					</div>
				</Splitter.Panel>

				{/* Панель 2: расписание */}
				<Splitter.Panel collapsible={{ start: true }}>
					<div className='h-full overflow-auto p-4'>
						<GridComponent
							yearOfAdmission={yearOfAdmission}
							semester={selectedSemester}
							onSemesterChange={setSelectedSemester}
						/>
					</div>
				</Splitter.Panel>

				{/* Панель 3: пожелания преподавателей */}
				<Splitter.Panel>
					<div className='h-full overflow-auto p-4'>
						{selectedDiscipline ? (
							(() => {
								// console.log(selectedDiscipline.disciplineName)
								// console.log(disciplinesWishes)
								const matchingWish = disciplinesWishes?.find(
									wish => wish.discipline === selectedDiscipline.disciplineName
								)
								// Если disciplinesText не является массивом, возвращаем null
								const matchingText =
									Array.isArray(disciplinesText) &&
									disciplinesText.find(
										text =>
											text.discipline === selectedDiscipline.disciplineName
									)

								return (
									<div>
										{matchingWish ? (
											<div>
												<p>
													<strong>Тип аудитории:</strong>{' '}
													{matchingWish.audienceType?.title}
												</p>
												<p>
													<strong>Пожелание:</strong> {disciplinesText}
												</p>
											</div>
										) : (
											<p>Пожелания для выбранной дисциплины не найдены.</p>
										)}
									</div>
								)
							})()
						) : (
							<>Дисциплина не выбрана</>
						)}
					</div>
				</Splitter.Panel>
			</Splitter>
		</div>
	)
}
