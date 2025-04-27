import groupService from '@/services/group/group.service'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	Button,
	Form,
	Input,
	Modal,
	notification,
	Table,
	Tooltip,
	Typography,
} from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export interface Group {
	id: string
	title: string
	countStudents: string
	code: string | null
	direction: string | null
	formEducation: string | null
	durationPeriod: string | null
	yearEnrollment: string | null
	studyPlanId: string | null
}

export function Group() {
	const queryClient = useQueryClient()
	const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
	const [form] = Form.useForm()

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
			render: (text: string) => text || '',
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
							<Tooltip title='Просмотреть в конструкторе'>
								<Link
									to={`/zao-constructor?groupId=${groupId}&studyPlanId=${studyPlanId}&yearOfAdmission=${year}`}
								>
									<Button type='link' icon={<EyeOutlined />} />
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
		durationPeriod: group.durationPeriod,
		formEducation: group.formEducation,
		yearEnrollment: group.yearEnrollment,
		studyPlanId: group.studyPlanId,
	}))

	return (
		<>
			<h2>Группы</h2>
			<Button
				type='primary'
				onClick={() => openModal('create')}
				style={{ marginBottom: 16, marginTop: 16 }}
			>
				Добавить группу
			</Button>
			<Table
				dataSource={dataSource}
				columns={columns}
				pagination={false}
				rowKey='id'
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
