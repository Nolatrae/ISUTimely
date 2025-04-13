
import AudienceTypeService from '@/services/audienceType/AudienceTypeService'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Modal, notification, Table, Tooltip, Typography } from 'antd'
import { useState } from 'react'

interface AudienceType {
	id: string
	title: string
}

export function AudienceType() {
	const queryClient = useQueryClient()
	const [currentAudienceType, setCurrentAudienceType] = useState<AudienceType | null>(null)
	const [form] = Form.useForm()

	// **Объединённое состояние модальных окон**
	const [modalState, setModalState] = useState<'create' | 'edit' | 'delete' | null>(null)

	// Запрос списка типов аудиторий
	const { data: audienceTypesData, isLoading, error } = useQuery<AudienceType[]>({
		queryKey: ['audienceTypes'],
		queryFn: () => AudienceTypeService.getAll()
	})

	// **Открытие модального окна**
	const openModal = (type: 'create' | 'edit' | 'delete', audienceType?: AudienceType) => {
		setCurrentAudienceType(audienceType || null)
		setModalState(type)

		if (type === 'create') {
			form.resetFields() // Очищаем форму при создании
		} else if (type === 'edit' && audienceType) {
			form.setFieldsValue(audienceType) // Заполняем форму при редактировании
		}
	}

	// **Закрытие всех модальных окон**
	const handleCancel = () => {
		setModalState(null)
		setCurrentAudienceType(null)
	}

	// **Мутации**
	const { mutate: addAudienceType } = useMutation({
		mutationKey: ['audienceTypes'],
		mutationFn: async (data: { title: string }) => {
			await AudienceTypeService.create(data)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['audienceTypes'] })
			notification.success({ message: 'Тип аудитории успешно добавлен' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при добавлении типа аудитории' })
		}
	})

	const { mutate: deleteAudienceType } = useMutation({
		mutationKey: ['audienceTypes'],
		mutationFn: async (id: string) => {
			await AudienceTypeService.delete(id)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['audienceTypes'] })
			notification.success({ message: 'Тип аудитории успешно удалён' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при удалении типа аудитории' })
		}
	})

	const { mutate: updateAudienceType } = useMutation({
		mutationKey: ['audienceTypes'],
		mutationFn: async ({ id, title }: { id: string; title: string }) => {
			await AudienceTypeService.update(id, { title })
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['audienceTypes'] })
			notification.success({ message: 'Тип аудитории успешно обновлён' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при обновлении типа аудитории' })
		}
	})

	// **Обработка удаления типа аудитории**
	const handleDelete = () => {
		if (currentAudienceType) {
			deleteAudienceType(currentAudienceType.id)
		}
	}

	// **Обработка отправки формы**
	const handleSubmit = async (values: { title: string }) => {
		if (currentAudienceType) {
			updateAudienceType({ id: currentAudienceType.id, title: values.title })
		} else {
			addAudienceType(values)
		}
	}

	// **Столбцы таблицы**
	const columns = [
		{
			title: 'Название типа аудитории',
			dataIndex: 'title',
			key: 'title'
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (text: string, audienceType: AudienceType) => (
				<>
					<Tooltip title='Редактировать'>
						<Button type='link' icon={<EditOutlined />} onClick={() => openModal('edit', audienceType)} />
					</Tooltip>
					<Tooltip title='Удалить'>
						<Button type='link' icon={<DeleteOutlined />} onClick={() => openModal('delete', audienceType)} />
					</Tooltip>
				</>
			)
		}
	]

	// **Загрузка или ошибка**
	if (isLoading) return <Typography.Text>Загрузка...</Typography.Text>
	if (error) return <Typography.Text type='danger'>Произошла ошибка при загрузке данных.</Typography.Text>

	// **Данные для таблицы**
	const dataSource = audienceTypesData?.map(audienceType => ({
		id: audienceType.id,
		title: audienceType.title
	}))

	return (
		<>
			<h2>Типы аудиторий</h2>
			<Button type='primary' onClick={() => openModal('create')} style={{ marginBottom: 16, marginTop: 16 }}>
				Добавить тип аудитории
			</Button>
			<Table dataSource={dataSource} columns={columns} pagination={false} rowKey='id' />

			{/* **Модальное окно для создания/редактирования** */}
			<Modal
				title={modalState === 'edit' ? 'Редактировать тип аудитории' : 'Добавить тип аудитории'}
				open={modalState === 'create' || modalState === 'edit'}
				onCancel={handleCancel}
				footer={null}
			>
				<Form form={form} layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						label='Название типа аудитории'
						name='title'
						rules={[{ required: true, message: 'Пожалуйста, введите название типа аудитории!' }]}
					>
						<Input />
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' style={{ width: '100%' }}>
							{modalState === 'edit' ? 'Сохранить изменения' : 'Создать тип аудитории'}
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
					Вы уверены, что хотите удалить тип аудитории <strong>{currentAudienceType?.title}</strong>?
				</Typography.Paragraph>
			</Modal>
		</>
	)
}
