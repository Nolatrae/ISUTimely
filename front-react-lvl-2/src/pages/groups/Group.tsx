import groupService from '@/services/group/group.service'
import {
	DeleteOutlined,
	EditOutlined,
	EyeOutlined,
	UndoOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	Button,
	Form,
	Input,
	Modal,
	notification,
	Select,
	Table,
	Tooltip,
	Typography,
} from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export interface SemesterInfo {
	semester: number
	startDate: string
	weeksCount: number
}

export interface Group {
	id: string
	title: string
	countStudents: string
	code: string | null
	direction: string | null
	profile: string | null
	formEducation: string | null
	durationPeriod: string | null
	yearEnrollment: string | null
	studyPlanId: string | null
	studyPlan?: {
		id: string
		semesters: SemesterInfo[]
	}
}

export function Group() {
	const queryClient = useQueryClient()
	const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
	const [form] = Form.useForm()
	const [selectedGroups, setSelectedGroups] = useState<string[]>([])
	const [selectMode, setSelectMode] = useState(false)
	const [semester, setSemester] = useState<string | null>(null)
	const [educationForm, setEducationForm] = useState<string | null>(null)
	const [reportSelected, setReportSelected] = useState(false)

	// Объединённое состояние модальных окон
	const [modalState, setModalState] = useState<
		'create' | 'edit' | 'delete' | null
	>(null)

	// Запрос списка групп
	const {
		data: groupsData,
		isLoading,
		error,
	} = useQuery<Group[]>({
		queryKey: ['groups'],
		queryFn: () => groupService.getAll(),
	})

	console.log(groupsData)

	// Открытие модального окна
	const openModal = (type: 'create' | 'edit' | 'delete', group?: Group) => {
		setCurrentGroup(group || null)
		setModalState(type)

		if (type === 'create') {
			form.resetFields() // Очищаем форму при создании
		} else if (type === 'edit' && group) {
			form.setFieldsValue(group) // Заполняем форму при редактировании
		}
	}

	// Закрытие всех модальных окон
	const handleCancel = () => {
		setModalState(null)
		setCurrentGroup(null)
	}

	// Мутации
	const { mutate: addGroup } = useMutation({
		mutationKey: ['groups'],
		mutationFn: async (data: { title: string; countStudents: number }) => {
			await groupService.create(data)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['groups'] })
			notification.success({ message: 'Группа успешно добавлена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при добавлении группы' })
		},
	})

	const { mutate: deleteGroup } = useMutation({
		mutationKey: ['groups'],
		mutationFn: async (id: string) => {
			await groupService.delete(id)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['groups'] })
			notification.success({ message: 'Группа успешно удалена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при удалении группы' })
		},
	})

	const { mutate: updateGroup } = useMutation({
		mutationKey: ['groups'],
		mutationFn: async ({
			id,
			title,
			countStudents,
		}: {
			id: string
			title: string
			countStudents: number
		}) => {
			await groupService.update(id, { title, countStudents })
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['groups'] })
			notification.success({ message: 'Группа успешно обновлена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при обновлении группы' })
		},
	})

	// Обработка удаления группы
	const handleDelete = () => {
		if (currentGroup) {
			deleteGroup(currentGroup.id)
		}
	}

	// Обработка отправки формы
	const handleSubmit = async (values: {
		title: string
		countStudents: number
	}) => {
		if (currentGroup) {
			updateGroup({
				id: currentGroup.id,
				title: values.title,
				countStudents: values.countStudents,
			})
		} else {
			addGroup(values)
		}
	}

	const handleSelectChange = (selectedRowKeys: string[]) => {
		setSelectedGroups(selectedRowKeys)
	}

	// Столбцы таблицы
	const columns = [
		{
			title: 'Название группы',
			dataIndex: 'title',
			key: 'title',
		},
		{
			title: 'Количество студентов',
			dataIndex: 'countStudents',
			key: 'countStudents',
		},
		{
			title: 'Код',
			dataIndex: 'code',
			key: 'code',
			render: (text: string) => text || '',
		},
		{
			title: 'Направление',
			dataIndex: 'direction',
			key: 'direction',
			render: (text: string) => text || '',
		},
		{
			title: 'Профиль',
			dataIndex: 'profile',
			key: 'profile',
			render: (text: string) => text || '',
		},
		{
			title: 'Форма обучения',
			dataIndex: 'formEducation',
			key: 'formEducation',
			render: (text: string) => text || '',
		},
		{
			title: 'Продолжительность (лет)',
			dataIndex: 'durationPeriod',
			key: 'durationPeriod',
			render: (text: string) => text || '',
		},
		{
			title: 'Год поступления',
			dataIndex: 'yearEnrollment',
			key: 'yearEnrollment',
			render: (text: string) => {
				if (text) {
					const date = new Date(text)
					return date.getFullYear()
				}
				return ''
			},
		},
		{
			title: 'Семестры (начало и длительность)',
			key: 'semesters',
			render: (_: any, group: Group) => {
				const sems = group.studyPlan?.semesters
					? [...group.studyPlan.semesters].sort(
							(a, b) => a.semester - b.semester
					  )
					: []

				if (sems.length === 0) return null

				// Группируем по два элемента
				const rows: SemesterInfo[][] = []
				for (let i = 0; i < sems.length; i += 2) {
					rows.push(sems.slice(i, i + 2))
				}

				return (
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						{rows.map((pair, idx) => (
							<div
								key={idx}
								style={{
									display: 'flex',
									columnGap: 16,
									marginBottom: 4,
								}}
							>
								{pair.map(s => (
									<div
										key={s.semester}
										style={{
											width: '50%',
											whiteSpace: 'nowrap',
										}}
									>
										<strong>Сем {s.semester}:</strong>{' '}
										{new Date(s.startDate).toLocaleDateString('ru-RU')} (
										{s.weeksCount} {s.weeksCount === 1 ? 'неделя' : 'недели'})
									</div>
								))}
								{pair.length === 1 && <div style={{ width: '50%' }} />}
							</div>
						))}
					</div>
				)
			},
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (text: string, group: Group) => {
				const year = group.yearEnrollment
					? new Date(group.yearEnrollment).getFullYear()
					: ''
				const studyPlanId = group.studyPlanId
				const groupId = group.id

				return (
					<>
						{year && studyPlanId && (
							<Tooltip title='Просмотреть в  заочном конструкторе'>
								<Link
									to={`/zao-constructor?groupId=${groupId}&studyPlanId=${studyPlanId}&yearOfAdmission=${year}`}
								>
									<Button type='link' icon={<EyeOutlined />} />
								</Link>
							</Tooltip>
						)}
						{year && studyPlanId && (
							<Tooltip title='Просмотреть в очном конструкторе'>
								<Link
									to={`/constructor?groupId=${groupId}&studyPlanId=${studyPlanId}&yearOfAdmission=${year}`}
								>
									<Button type='link' icon={<EyeOutlined />} />
								</Link>
							</Tooltip>
						)}
						{year && studyPlanId && (
							<Tooltip title='Редактировать расписание'>
								<Link
									to={`/edit-constructor?groupId=${groupId}&studyPlanId=${studyPlanId}&yearOfAdmission=${year}`}
								>
									<Button type='link' icon={<UndoOutlined />} />
								</Link>
							</Tooltip>
						)}
						<Tooltip title='Редактировать'>
							<Button
								type='link'
								icon={<EditOutlined />}
								onClick={() => openModal('edit', group)}
							/>
						</Tooltip>
						<Tooltip title='Удалить'>
							<Button
								type='link'
								icon={<DeleteOutlined />}
								onClick={() => openModal('delete', group)}
							/>
						</Tooltip>
					</>
				)
			},
		},
	]

	// Загрузка или ошибка
	if (isLoading) return <Typography.Text>Загрузка...</Typography.Text>
	if (error)
		return (
			<Typography.Text type='danger'>
				Произошла ошибка при загрузке данных.
			</Typography.Text>
		)

	// Данные для таблицы
	const dataSource = groupsData?.map(group => ({
		id: group.id,
		title: group.title,
		countStudents: group.countStudents,
		code: group.code,
		direction: group.direction,
		profile: group.profile,
		durationPeriod: group.durationPeriod,
		formEducation: group.formEducation,
		yearEnrollment: group.yearEnrollment,
		studyPlanId: group.studyPlanId,
		studyPlan: group.studyPlan, // ← вот это
	}))

	const createReport = async (
		selectedGroupIds: string[],
		semester: string | null,
		educationForm: string | null
	) => {
		if (!semester) {
			notification.error({ message: 'Пожалуйста, выберите полугодие' })
			return
		}

		try {
			await groupService.createReport(selectedGroupIds, semester, educationForm)
			await new Promise(resolve => setTimeout(resolve, 300))
			notification.error({ message: 'Ошибка при создании отчёта' })
		} catch (error) {
			notification.success({ message: 'Отчёт успешно создан' })
		}
	}

	const rowSelection = selectMode
		? {
				selectedRowKeys: selectedGroups,
				onChange: handleSelectChange,
		  }
		: null

	const halfYearOptions = Array.from({ length: 10 }, (_, i) => {
		const year = 2021 + Math.floor(i / 2)
		const half = i % 2 === 0 ? 1 : 2
		return {
			value: `${year}H${half}`,
			label: `${year} год — ${half} полугодие`,
		}
	})

	return (
		<>
			<h2 className='text-black'>Группы</h2>
			<div className='flex'>
				<Button
					type='primary'
					onClick={() => setSelectMode(!selectMode)}
					style={{ marginBottom: 16, marginTop: 16 }}
				>
					{selectMode ? 'Отменить выбор' : 'Выбрать'}
				</Button>

				{selectMode && (
					<>
						<Select
							value={semester}
							onChange={setSemester}
							placeholder='Выберите полугодие'
							style={{
								width: 200,
								marginBottom: 16,
								marginTop: 16,
								marginLeft: 8,
							}}
						>
							{halfYearOptions.map(option => (
								<Select.Option key={option.value} value={option.value}>
									{option.label}
								</Select.Option>
							))}
						</Select>

						<Select
							value={educationForm}
							onChange={setEducationForm}
							placeholder='Выберите форму обучения'
							style={{
								width: 200,
								marginLeft: 8,
								marginBottom: 16,
								marginTop: 16,
							}}
						>
							<Select.Option value='full-time'>Очный</Select.Option>
							<Select.Option value='part-time'>Заочный</Select.Option>
							<Select.Option value='forlabs'>Импорт в форлабс</Select.Option>
						</Select>

						<Button
							type='primary'
							onClick={() =>
								createReport(selectedGroups, semester, educationForm)
							}
							disabled={
								selectedGroups.length === 0 || !semester || !educationForm
							}
							style={{ marginBottom: 16, marginTop: 16, marginLeft: 8 }}
						>
							Создать отчёт
						</Button>
					</>
				)}

				<Button
					type='primary'
					onClick={() => openModal('create')}
					style={{ marginBottom: 16, marginTop: 16 }}
					className='ml-auto'
				>
					Добавить группу
				</Button>
			</div>

			<Table
				dataSource={groupsData}
				columns={columns}
				rowKey='id'
				pagination={false}
				rowSelection={rowSelection}
			/>

			{/* Модальное окно для создания/редактирования */}
			<Modal
				title={
					modalState === 'edit' ? 'Редактировать группу' : 'Добавить группу'
				}
				open={modalState === 'create' || modalState === 'edit'}
				onCancel={handleCancel}
				footer={null}
			>
				<Form form={form} layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						label='Название группы'
						name='title'
						rules={[
							{
								required: true,
								message: 'Пожалуйста, введите название группы!',
							},
						]}
					>
						<Input />
					</Form.Item>
					<Form.Item
						label='Количество студентов'
						name='countStudents'
						rules={[
							{
								required: true,
								message: 'Пожалуйста, введите количество студентов!',
							},
						]}
					>
						<Input type='number' />
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' style={{ width: '100%' }}>
							{modalState === 'edit' ? 'Сохранить изменения' : 'Создать группу'}
						</Button>
					</Form.Item>
				</Form>
			</Modal>

			{/* Модальное окно для удаления */}
			<Modal
				title='Подтверждение удаления'
				open={modalState === 'delete'}
				onCancel={handleCancel}
				onOk={handleDelete}
				okText='Удалить'
				cancelText='Отменить'
			>
				<Typography.Paragraph>
					Вы уверены, что хотите удалить группу{' '}
					<strong>{currentGroup?.title}</strong>?
				</Typography.Paragraph>
			</Modal>
		</>
	)
}
