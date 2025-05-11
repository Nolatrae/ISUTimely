import { useProfile } from '@/hooks/useProfile'
import AudienceTypeService from '@/services/audienceType/AudienceTypeService'
import { disciplineService } from '@/services/disciplines/discipline.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, notification, Select, Table } from 'antd'
import { useEffect, useState } from 'react'

const { Option } = Select

const TeacherDisciplineWish = () => {
	// Запрос на получение типов аудиторий
	const {
		data: audienceTypesData,
		isLoading: isAudienceLoading,
		error: AudienceError,
	} = useQuery<any[]>({
		queryKey: ['audienceTypes'],
		queryFn: () => AudienceTypeService.getAll(),
	})

	const { user } = useProfile()
	const queryClient = useQueryClient()
	const teacherId = user?.Teacher.id
	console.log(teacherId)

	// Запрос на получение дисциплин
	const {
		data: disciplinesData,
		isLoading: isDisciplineLoading,
		error: disciplineError,
	} = useQuery({
		queryKey: ['disciplines'],
		queryFn: () => disciplineService.getTeacherPairs(teacherId),
	})

	const {
		data: disciplinesText,
		isLoading: isTextLoading,
		error: textError,
	} = useQuery({
		queryKey: ['text'],
		queryFn: () => disciplineService.getTeacherText(teacherId),
	})

	// Мутация для сохранения пожеланий преподавателя
	const { mutate: savePrefer } = useMutation({
		mutationKey: ['teacherPreferences'],
		mutationFn: async (preferences: any) => {
			await disciplineService.saveTeacherPreferences(preferences.teacherId, {
				audienceTypes: preferences.audienceTypes,
				wishText: preferences.wishText,
			})
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['disciplines'] })
			notification.success({ message: 'Пожелания успешно сохранены' })
		},
		onError: async () => {
			notification.error({ message: 'Ошибка при сохранении пожеланий' })
		},
	})

	// Храним состояния для каждого селекта (по дисциплине)
	const [selectedAudienceTypes, setSelectedAudienceTypes] = useState<{
		[disciplineId: string]: string // Просто ID типа аудитории
	}>({})

	const [wishText, setWishText] = useState('')

	// Инициализируем состояние по данным дисциплин
	useEffect(() => {
		if (disciplinesData) {
			const initialAudienceTypes: any = {}
			disciplinesData.forEach(discipline => {
				initialAudienceTypes[discipline.id] = discipline.audienceType?.id || ''
			})
			setSelectedAudienceTypes(initialAudienceTypes)
		}

		// Если есть текстовое пожелание, устанавливаем его в состояние
		if (disciplinesText) {
			setWishText(disciplinesText)
		}
	}, [disciplinesData, disciplinesText])

	// Функция для изменения типа аудитории
	const handleAudienceChange = (
		disciplineId: string,
		audienceTypeId: string
	) => {
		setSelectedAudienceTypes(prev => ({
			...prev,
			[disciplineId]: audienceTypeId, // Обновляем только ID типа аудитории
		}))
	}

	// Функция для изменения текста пожеланий
	const handleWishTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setWishText(e.target.value)
	}

	// Сохранение предпочтений
	const savePreferences = async () => {
		try {
			// Формируем список предпочтений для каждой дисциплины
			const updatedAssignments = Object.entries(selectedAudienceTypes).map(
				([disciplineId, audienceTypeId]) => ({
					id: disciplineId, // ID дисциплины
					audienceTypeId, // ID типа аудитории
				})
			)

			const preferences = {
				teacherId: teacherId, // ID преподавателя
				audienceTypes: updatedAssignments, // Преобразованные предпочтения
				wishText,
			}

			// Вызываем мутацию и передаем объект с данными
			savePrefer(preferences)
		} catch (error) {
			console.log(error)
		}
	}

	// Колонки для таблицы
	const columns = [
		{
			title: 'Дисциплина',
			dataIndex: 'discipline',
			key: 'discipline',
			render: (discipline: string) => <span>{discipline}</span>,
		},
		{
			title: 'Тип дисциплины',
			dataIndex: 'type',
			key: 'type',
			render: (type: string) => (
				<span>{type === 'lecture' ? 'Лекция' : 'Практика'}</span>
			),
		},
		{
			title: 'Тип аудитории',
			key: 'audience',
			render: (_: any, record: any) => (
				<Select
					style={{ width: 200 }}
					value={selectedAudienceTypes[record.disciplineId] || ''}
					onChange={value => handleAudienceChange(record.disciplineId, value)}
					loading={isAudienceLoading}
					disabled={isAudienceLoading}
				>
					{audienceTypesData?.map((type: any) => (
						<Option key={type.id} value={type.id}>
							{type.title}
						</Option>
					))}
				</Select>
			),
		},
	]

	// Подготовка данных для таблицы
	const dataSource = disciplinesData?.map((discipline: any) => ({
		key: discipline.id,
		discipline: discipline.discipline, // Название дисциплины
		disciplineId: discipline.id,
		type: discipline.type,
		audienceTypeId: discipline.audienceType?.id,
	}))

	return (
		<>
			<h2>Пожелания преподавателя</h2>
			<div className='mt-4'>
				<Table
					rowKey='key'
					columns={columns}
					dataSource={dataSource}
					pagination={false}
					loading={isDisciplineLoading}
					bordered
				/>
				<Input.TextArea
					rows={4}
					value={wishText}
					onChange={handleWishTextChange}
					placeholder='Введите ваши пожелания...'
					style={{ marginTop: '20px', marginBottom: '20px' }}
				/>
				{/* Кнопка для сохранения пожеланий */}
				<Button type='primary' onClick={savePreferences}>
					Сохранить пожелания
				</Button>
			</div>
		</>
	)
}

export default TeacherDisciplineWish
