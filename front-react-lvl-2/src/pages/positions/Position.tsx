
import positionService from '@/services/positions/position.service'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Modal, notification, Table, Tooltip, Typography } from 'antd'
import { useState } from 'react'

interface Position {
	id: string
	title: string
}

export function Position() {
	const queryClient = useQueryClient()
	const [currentPosition, setCurrentPosition] = useState<Position | null>(null)
	const [form] = Form.useForm()

	// **Объединённое состояние модальных окон**
	const [modalState, setModalState] = useState<'create' | 'edit' | 'delete' | null>(null)

	// Запрос списка должностей
	const { data: positionsData, isLoading, error } = useQuery<Position[]>({
		queryKey: ['positions'],
		queryFn: () => positionService.getAll()
	})

	// **Открытие модального окна**
	const openModal = (type: 'create' | 'edit' | 'delete', position?: Position) => {
		setCurrentPosition(position || null)
		setModalState(type)

		if (type === 'create') {
			form.resetFields() // Очищаем форму при создании
		} else if (type === 'edit' && position) {
			form.setFieldsValue(position) // Заполняем форму при редактировании
		}
	}

	// **Закрытие всех модальных окон**
	const handleCancel = () => {
		setModalState(null)
		setCurrentPosition(null)
	}

	// **Мутации**
	const { mutate: addPosition } = useMutation({
		mutationKey: ['positions'],
		mutationFn: async (data: { title: string }) => {
			await positionService.create(data)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['positions'] })
			notification.success({ message: 'Должность успешно добавлена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при добавлении должности' })
		}
	})

	const { mutate: deletePosition } = useMutation({
		mutationKey: ['positions'],
		mutationFn: async (id: string) => {
			await positionService.delete(id)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['positions'] })
			notification.success({ message: 'Должность успешно удалена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при удалении должности' })
		}
	})

	const { mutate: updatePosition } = useMutation({
		mutationKey: ['positions'],
		mutationFn: async ({ id, title }: { id: string; title: string }) => {
			await positionService.update(id, { title })
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['positions'] })
			notification.success({ message: 'Должность успешно обновлена' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при обновлении должности' })
		}
	})

	// **Обработка удаления должности**
	const handleDelete = () => {
		if (currentPosition) {
			deletePosition(currentPosition.id)
		}
	}

	// **Обработка отправки формы**
	const handleSubmit = async (values: { title: string }) => {
		if (currentPosition) {
			updatePosition({ id: currentPosition.id, title: values.title })
		} else {
			addPosition(values)
		}
	}

	// **Столбцы таблицы**
	const columns = [
		{
			title: 'Название должности',
			dataIndex: 'title',
			key: 'title'
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (text: string, position: Position) => (
				<>
					<Tooltip title='Редактировать'>
						<Button type='link' icon={<EditOutlined />} onClick={() => openModal('edit', position)} />
					</Tooltip>
					<Tooltip title='Удалить'>
						<Button type='link' icon={<DeleteOutlined />} onClick={() => openModal('delete', position)} />
					</Tooltip>
				</>
			)
		}
	]

	// **Загрузка или ошибка**
	if (isLoading) return <Typography.Text>Загрузка...</Typography.Text>
	if (error) return <Typography.Text type='danger'>Произошла ошибка при загрузке данных.</Typography.Text>

	// **Данные для таблицы**
	const dataSource = positionsData?.map(pos => ({
		id: pos.id,
		title: pos.title
	}))

	return (
		<>
			<h2>Должности</h2>
			<Button type='primary' onClick={() => openModal('create')} style={{ marginBottom: 16, marginTop: 16 }}>
				Добавить должность
			</Button>
			<Table dataSource={dataSource} columns={columns} pagination={false} rowKey='id' />

			{/* **Модальное окно для создания/редактирования** */}
			<Modal
				title={modalState === 'edit' ? 'Редактировать должность' : 'Добавить должность'}
				open={modalState === 'create' || modalState === 'edit'}
				onCancel={handleCancel}
				footer={null}
			>
				<Form form={form} layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						label='Название должности'
						name='title'
						rules={[{ required: true, message: 'Пожалуйста, введите название должности!' }]}
					>
						<Input />
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' style={{ width: '100%' }}>
							{modalState === 'edit' ? 'Сохранить изменения' : 'Создать должность'}
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
					Вы уверены, что хотите удалить должность <strong>{currentPosition?.title}</strong>?
				</Typography.Paragraph>
			</Modal>
		</>
	)
}
