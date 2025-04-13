import {
	disciplineService,
	TeacherDisciplineAssignmentDto,
} from '@/services/disciplines/discipline.service'
import groupService from '@/services/group/group.service'
import usersService from '@/services/user/users.service'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Input, message, Select, Table } from 'antd'
import { useEffect, useState } from 'react'
import useDebounce from './useDebounce'

const { Option } = Select

export function SetPairsBetweenTeachers() {
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
	const [selectedTeachers, setSelectedTeachers] = useState<
		Record<string, string[]>
	>({})
	const [searchTerm, setSearchTerm] = useState('')
	const debouncedSearchTerm = useDebounce(searchTerm, 300)

	// Получаем группы для селекта
	const { data: groupsData, isLoading: isGroupLoading } = useQuery({
		queryKey: ['groups'],
		queryFn: () => groupService.getAll(),
	})

	// Получаем преподавателей
	const { data: usersData, isLoading: isUserLoading } = useQuery<any[]>({
		queryKey: ['users'],
		queryFn: async () => {
			const users = await usersService.getAll()
			const teachers = users.filter(user => user.rights.includes('TEACHER'))
			return teachers.map(user => ({
				...user,
				fullName: `${user.firstName} ${user.middleName} ${user.lastName}`,
				value: user.Teacher.id,
			}))
		},
	})

	// Запрос на получение форматированных дисциплин (метод getFormattedDisciplines)
	const {
		data: formattedDisciplines = [],
		refetch,
		isLoading: isDisciplinesLoading,
	} = useQuery({
		queryKey: ['formatted-disciplines', selectedGroupIds, selectedNumber],
		queryFn: () =>
			disciplineService.getFormattedDisciplines(
				selectedGroupIds,
				selectedNumber
			),
		enabled: false,
	})

	// При получении форматированных дисциплин заполняем состояние selectedTeachers,
	// чтобы назначенные преподаватели отображались после обновления страницы
	useEffect(() => {
		if (formattedDisciplines && formattedDisciplines.length > 0) {
			const initTeachers: Record<string, string[]> = {}
			formattedDisciplines.forEach((disc: any) => {
				initTeachers[disc.id] = disc.teachers || []
			})
			setSelectedTeachers(initTeachers)
		}
	}, [formattedDisciplines])

	// Формируем источник данных из форматированных дисциплин
	// Данные уже приходят в нужном формате: каждый объект имеет { id, title, type, teachers }
	const dataSource = (formattedDisciplines || [])
		.filter((discipline: any) =>
			discipline.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
		)
		.map((discipline: any) => ({
			key: discipline.id,
			id: discipline.id,
			title: discipline.title,
			type: discipline.type,
			teachers: selectedTeachers[discipline.id] || [],
		}))

	const columns = [
		{
			title: 'Дисциплина',
			dataIndex: 'title',
			key: 'discipline',
			render: (text: string, record: any) => (
				<span>
					<span style={{ color: record.type === 'lecture' ? 'blue' : 'red' }}>
						{record.type === 'lecture' ? 'Л' : 'П'}
					</span>
					<span> | </span>
					{record.title}
				</span>
			),
		},
		{
			title: 'Преподаватели',
			dataIndex: 'teachers',
			key: 'teachers',
			render: (teachers: string[], record: any) => (
				<Select
					mode='multiple'
					style={{ width: '300px' }}
					placeholder='Выберите преподавателей'
					value={teachers}
					onChange={selectedTeacherIds =>
						setSelectedTeachers(prev => ({
							...prev,
							[record.id]: selectedTeacherIds,
						}))
					}
					showSearch
					filterOption={(input, option) =>
						option?.children.toLowerCase().includes(input.toLowerCase())
					}
				>
					{usersData && usersData.length > 0 ? (
						usersData.map(teacher => (
							<Option key={teacher.value} value={teacher.value}>
								{teacher.fullName}
							</Option>
						))
					) : (
						<Option disabled>Нет данных</Option>
					)}
				</Select>
			),
		},
	]

	// Мутация для обновления назначений преподавателей для дисциплин
	const { mutate: updateAssignments } = useMutation({
		mutationKey: ['update-teacher-assignments'],
		mutationFn: async (assignments: TeacherDisciplineAssignmentDto[]) => {
			return await disciplineService.updateTeacherAssignments(assignments)
		},
		onSuccess: () => {
			message.success('Назначения преподавателей успешно обновлены')
		},
		onError: () => {
			message.error('Ошибка при обновлении назначений преподавателей')
		},
	})

	// Обработчик для применения фильтров (группы и семестр необязательны)
	const handleFilter = async () => {
		try {
			await refetch()
		} catch (error) {
			console.error(error)
			message.error('Ошибка при получении дисциплин')
		}
	}

	// Обработчик для отправки изменений на сервер:
	// Собираем только те записи, у которых выбраны преподаватели
	const handleSaveChanges = () => {
		const assignmentsToSend: TeacherDisciplineAssignmentDto[] = dataSource.map(
			(row: any) => ({
				discipline: row.title,
				type: row.type,
				teachers: row.teachers, // даже если массив пустой, он будет отправлен
			})
		)

		if (assignmentsToSend.length === 0) {
			message.warning('Нет изменений для сохранения')
			return
		}
		updateAssignments(assignmentsToSend)
	}

	return (
		<div>
			{/* Все элементы фильтрации на одной строке */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '16px',
					marginBottom: '16px',
				}}
			>
				<Select
					mode='multiple'
					style={{ minWidth: 300 }}
					placeholder='Выберите группы для анализа'
					value={selectedGroupIds}
					onChange={(value: string[]) => setSelectedGroupIds(value)}
					loading={isGroupLoading}
				>
					{groupsData?.map(
						group =>
							group && (
								<Option key={group.id} value={group.id}>
									{group.title}
								</Option>
							)
					)}
				</Select>
				<Select
					style={{ minWidth: 100 }}
					placeholder='Номер'
					value={selectedNumber || undefined}
					onChange={value => setSelectedNumber(value)}
				>
					{Array.from({ length: 8 }, (_, i) => (
						<Option key={i + 1} value={i + 1}>
							{i + 1}
						</Option>
					))}
				</Select>
				<Input
					style={{ width: 300 }}
					placeholder='Поиск по дисциплине'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
				/>
				<Button type='primary' onClick={handleFilter}>
					Применить фильтры
				</Button>
				<Button type='primary' onClick={handleSaveChanges}>
					Сохранить изменения
				</Button>
			</div>
			<Table
				rowKey='id'
				columns={columns}
				dataSource={dataSource}
				pagination={false}
				loading={isDisciplinesLoading || isGroupLoading || isUserLoading}
			/>
		</div>
	)
}
