import departmentsService from '@/services/department/departments.service'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Modal, notification, Table, Tooltip, Typography } from 'antd'
import { useState } from 'react'

interface Department {
	id: string
	title: string
}

export function Department() {
	const queryClient = useQueryClient()
	const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null)
	const [form] = Form.useForm()

	// **Объединённое состояние модальных окон**
	const [modalState, setModalState] = useState<'create' | 'edit' | 'delete' | null>(null)

	// Запрос списка кафедр
	const { data: departmentsData, isLoading, error } = useQuery<Department[]>({
		queryKey: ['departments'],
		queryFn: () => departmentsService.getAll()
	})

	// **Открытие модального окна**
	const openModal = (type: 'create' | 'edit' | 'delete', department?: Department) => {
		setCurrentDepartment(department || null)
		setModalState(type)

		if (type === 'create') {
			form.resetFields() // Очищаем форму при создании
		} else if (type === 'edit' && department) {
			form.setFieldsValue(department) // Заполняем форму при редактировании
		}
	}

	// **Закрытие всех модальных окон**
	const handleCancel = () => {
		setModalState(null)
		setCurrentDepartment(null)
	}

	// **Мутации**
	const { mutate: addDepartment } = useMutation({
		mutationKey: ['departments'],
		mutationFn: async (data: { title: string }) => {
			await departmentsService.create(data)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['departments'] })
			notification.success({ message: 'Кафедра успешно добавлена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при добавлении кафедры' })
		}
	})

	const { mutate: deleteDepartment } = useMutation({
		mutationKey: ['departments'],
		mutationFn: async (id: string) => {
			await departmentsService.delete(id)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['departments'] })
			notification.success({ message: 'Кафедра успешно удалена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при удалении кафедры' })
		}
	})

	const { mutate: updateDepartment } = useMutation({
		mutationKey: ['departments'],
		mutationFn: async ({ id, title }: { id: string; title: string }) => {
			await departmentsService.update(id, { title })
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['departments'] })
			notification.success({ message: 'Кафедра успешно обновлена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при обновлении кафедры' })
		}
	})

	// **Обработка удаления кафедры**
	const handleDelete = () => {
		if (currentDepartment) {
			deleteDepartment(currentDepartment.id)
		}
	}

	// **Обработка отправки формы**
	const handleSubmit = async (values: { title: string }) => {
		if (currentDepartment) {
			updateDepartment({ id: currentDepartment.id, title: values.title })
		} else {
			addDepartment(values)
		}
	}

	// **Столбцы таблицы**
	const columns = [
		{
			title: 'Название кафедры',
			dataIndex: 'title',
			key: 'title'
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (text: string, department: Department) => (
				<>
					<Tooltip title='Редактировать'>
						<Button type='link' icon={<EditOutlined />} onClick={() => openModal('edit', department)} />
					</Tooltip>
					<Tooltip title='Удалить'>
						<Button type='link' icon={<DeleteOutlined />} onClick={() => openModal('delete', department)} />
					</Tooltip>
				</>
			)
		}
	]

	// **Загрузка или ошибка**
	if (isLoading) return <Typography.Text>Загрузка...</Typography.Text>
	if (error) return <Typography.Text type='danger'>Произошла ошибка при загрузке данных.</Typography.Text>

	// **Данные для таблицы**
	const dataSource = departmentsData?.map(dep => ({
		id: dep.id,
		title: dep.title
	}))

	return (
		<>
			<h2>Кафедры</h2>
			<Button type='primary' onClick={() => openModal('create')} style={{ marginBottom: 16, marginTop: 16 }}>
				Добавить кафедру
			</Button>
			<Table dataSource={dataSource} columns={columns} pagination={false} rowKey='id' />

			{/* **Модальное окно для создания/редактирования** */}
			<Modal
				title={modalState === 'edit' ? 'Редактировать кафедру' : 'Добавить кафедру'}
				open={modalState === 'create' || modalState === 'edit'}
				onCancel={handleCancel}
				footer={null}
			>
				<Form form={form} layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						label='Название кафедры'
						name='title'
						rules={[{ required: true, message: 'Пожалуйста, введите название кафедры!' }]}
					>
						<Input />
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' style={{ width: '100%' }}>
							{modalState === 'edit' ? 'Сохранить изменения' : 'Создать кафедру'}
						</Button>
					</Form.Item>
				</Form>
			</Modal>

			{/* **Модальное окно для удаления** */}
			<Modal
				title='Подтверждение удаления'
				open={modalState === 'delete'}
				onCancel={handleCancel}
				onOk={handleDelete}
				okText='Удалить'
				cancelText='Отменить'
			>
				<Typography.Paragraph>
					Вы уверены, что хотите удалить кафедру <strong>{currentDepartment?.title}</strong>?
				</Typography.Paragraph>
			</Modal>
		</>
	)
}
