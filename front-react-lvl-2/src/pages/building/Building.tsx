
import buildingService from '@/services/building/building.service'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Modal, notification, Table, Tooltip, Typography } from 'antd'
import { useState } from 'react'

interface Building {
	id: string
	title: string
}

export function Building() {
	const queryClient = useQueryClient()
	const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null)
	const [form] = Form.useForm()

	// **Объединённое состояние модальных окон**
	const [modalState, setModalState] = useState<'create' | 'edit' | 'delete' | null>(null)

	// Запрос списка зданий
	const { data: buildingsData, isLoading, error } = useQuery<Building[]>({
		queryKey: ['buildings'],
		queryFn: () => buildingService.getAll()
	})

	// **Открытие модального окна**
	const openModal = (type: 'create' | 'edit' | 'delete', building?: Building) => {
		setCurrentBuilding(building || null)
		setModalState(type)

		if (type === 'create') {
			form.resetFields() // Очищаем форму при создании
		} else if (type === 'edit' && building) {
			form.setFieldsValue(building) // Заполняем форму при редактировании
		}
	}

	// **Закрытие всех модальных окон**
	const handleCancel = () => {
		setModalState(null)
		setCurrentBuilding(null)
	}

	// **Мутации**
	const { mutate: addBuilding } = useMutation({
		mutationKey: ['buildings'],
		mutationFn: async (data: { title: string }) => {
			await buildingService.create(data)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
			notification.success({ message: 'Здание успешно добавлено' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при добавлении здания' })
		}
	})

	const { mutate: deleteBuilding } = useMutation({
		mutationKey: ['buildings'],
		mutationFn: async (id: string) => {
			await buildingService.delete(id)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
			notification.success({ message: 'Здание успешно удалено' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при удалении здания' })
		}
	})

	const { mutate: updateBuilding } = useMutation({
		mutationKey: ['buildings'],
		mutationFn: async ({ id, title }: { id: string; title: string }) => {
			await buildingService.update(id, { title })
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
			notification.success({ message: 'Здание успешно обновлено' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при обновлении здания' })
		}
	})

	// **Обработка удаления здания**
	const handleDelete = () => {
		if (currentBuilding) {
			deleteBuilding(currentBuilding.id)
		}
	}

	// **Обработка отправки формы**
	const handleSubmit = async (values: { title: string }) => {
		if (currentBuilding) {
			updateBuilding({ id: currentBuilding.id, title: values.title })
		} else {
			addBuilding(values)
		}
	}

	// **Столбцы таблицы**
	const columns = [
		{
			title: 'Название здания',
			dataIndex: 'title',
			key: 'title'
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (text: string, building: Building) => (
				<>
					<Tooltip title='Редактировать'>
						<Button type='link' icon={<EditOutlined />} onClick={() => openModal('edit', building)} />
					</Tooltip>
					<Tooltip title='Удалить'>
						<Button type='link' icon={<DeleteOutlined />} onClick={() => openModal('delete', building)} />
					</Tooltip>
				</>
			)
		}
	]

	// **Загрузка или ошибка**
	if (isLoading) return <Typography.Text>Загрузка...</Typography.Text>
	if (error) return <Typography.Text type='danger'>Произошла ошибка при загрузке данных.</Typography.Text>

	// **Данные для таблицы**
	const dataSource = buildingsData?.map(building => ({
		id: building.id,
		title: building.title
	}))

	return (
		<>
			<h2>Здания</h2>
			<Button type='primary' onClick={() => openModal('create')} style={{ marginBottom: 16, marginTop: 16 }}>
				Добавить здание
			</Button>
			<Table dataSource={dataSource} columns={columns} pagination={false} rowKey='id' />

			{/* **Модальное окно для создания/редактирования** */}
			<Modal
				title={modalState === 'edit' ? 'Редактировать здание' : 'Добавить здание'}
				open={modalState === 'create' || modalState === 'edit'}
				onCancel={handleCancel}
				footer={null}
			>
				<Form form={form} layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						label='Название здания'
						name='title'
						rules={[{ required: true, message: 'Пожалуйста, введите название здания!' }]}
					>
						<Input />
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' style={{ width: '100%' }}>
							{modalState === 'edit' ? 'Сохранить изменения' : 'Создать здание'}
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
					Вы уверены, что хотите удалить здание <strong>{currentBuilding?.title}</strong>?
				</Typography.Paragraph>
			</Modal>
		</>
	)
}
