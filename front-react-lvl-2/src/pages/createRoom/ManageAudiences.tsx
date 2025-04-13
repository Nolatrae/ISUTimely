import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	Button,
	Form,
	Input,
	Modal,
	Select,
	Table,
	Tooltip,
	Typography,
	notification,
} from 'antd'
import { useState } from 'react'

import AudienceTypeService from '@/services/audienceType/AudienceTypeService'
import buildingService from '@/services/building/building.service'
import equipmentService from '@/services/equipment/equipment.service'
import audienceService from '@/services/room/audience.service'
import type { Equipment } from '@/types/types'

export function ManageAudiences() {
	const queryClient = useQueryClient()

	// Запрос на получение аудитории
	const {
		data: audienceList,
		isLoading,
		error,
	} = useQuery<any[]>({
		queryKey: ['audience'],
		queryFn: () => audienceService.getAll(),
	})

	// Запрос на получение оборудования
	const {
		data: equipmentList,
		isLoading: equipmentLoading,
		error: equipmentError,
	} = useQuery<Equipment[]>({
		queryKey: ['equipments'],
		queryFn: () => equipmentService.getAll(),
	})

	// Запрос на типы кабинетов
	const {
		data: audienceTypeList,
		isLoading: AudienceTypeLoading,
		error: AudienceTypeError,
	} = useQuery<any[]>({
		queryKey: ['audienceTypes'],
		queryFn: () => AudienceTypeService.getAll(),
	})

	// Запрос на здания
	const {
		data: buildingList,
		isLoading: buildingLoading,
		error: buildingError,
	} = useQuery<any[]>({
		queryKey: ['buildings'],
		queryFn: () => buildingService.getAll(),
	})

	// Мутация для добавления аудитории
	const { mutate: addAudience } = useMutation({
		mutationKey: ['audience'],
		mutationFn: async (newAudience: any) => {
			console.log(newAudience)
			await audienceService.create(newAudience)
		},
		async onSuccess() {
			// Инвалидируем запросы, чтобы получить обновленные данные
			queryClient.invalidateQueries({ queryKey: ['audience'] })
			notification.success({
				message: 'Аудитория успешно добавлена',
			})
		},
		async onError() {
			notification.error({
				message: 'Ошибка при добавлении аудитории',
			})
		},
	})

	// Мутация для обновления аудитории
	const { mutate: updateAudience } = useMutation({
		mutationKey: ['audience/update'],
		mutationFn: async (updatedAudience: any) => {
			console.log(updatedAudience)
			const data = updatedAudience
			await audienceService.update(data)
		},
		async onSuccess() {
			// Инвалидируем запросы, чтобы получить обновленные данные
			queryClient.invalidateQueries({ queryKey: ['audience'] })
			notification.success({
				message: 'Аудитория успешно обновлена',
			})
		},
		async onError() {
			notification.error({
				message: 'Ошибка при обновлении аудитории',
			})
		},
	})

	// Мутация для удаления аудитории
	const { mutate: deleteAudience } = useMutation({
		mutationKey: ['audience/delete'],
		mutationFn: async (id: string) => {
			await audienceService.delete(id)
		},
		async onSuccess() {
			// Инвалидируем запросы, чтобы получить обновленные данные
			queryClient.invalidateQueries({ queryKey: ['audience'] })
			notification.success({
				message: 'Аудитория успешно удалена',
			})
		},
		async onError() {
			notification.error({
				message: 'Ошибка при удалении аудитории',
			})
		},
	})

	// Состояние для модальных окон
	const [isModalVisible, setIsModalVisible] = useState(false)
	const [isInfoModalVisible, setIsInfoModalVisible] = useState(false)
	const [isEditModalVisible, setIsEditModalVisible] = useState(false)
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
	const [selectedAudience, setSelectedAudience] = useState<any>(null)
	const [form] = Form.useForm() // Используем форму для управления состоянием формы

	// Фильтры для таблицы
	const [filters, setFilters] = useState({
		type: undefined,
		building: undefined,
	})

	// Обработчик изменения фильтра
	const handleFilterChange = (value: any, key: string) => {
		setFilters(prevFilters => ({
			...prevFilters,
			[key]: value,
		}))
	}

	// Открытие модального окна для создания аудитории
	const showModal = () => {
		setIsModalVisible(true)
	}

	// Закрытие модального окна для создания аудитории
	const handleCancel = () => {
		setIsModalVisible(false)
		setIsEditModalVisible(false)
		setIsDeleteModalVisible(false)
		form.resetFields() // Сброс формы
	}

	// Открытие модального окна для отображения дополнительной информации
	const showInfoModal = (audience: any) => {
		setSelectedAudience(audience)
		setIsInfoModalVisible(true)
	}

	// Закрытие модального окна с дополнительной информацией
	const handleInfoModalCancel = () => {
		setIsInfoModalVisible(false)
		setSelectedAudience(null)
	}

	// Открытие модального окна для редактирования аудитории
	const showEditModal = (audience: any) => {
		console.log(audience)
		setSelectedAudience(audience)
		setIsEditModalVisible(true)
		form.setFieldsValue(audience) // Заполняем форму данными аудитории для редактирования
	}

	// Открытие модального окна для удаления аудитории
	const showDeleteModal = (audience: any) => {
		setSelectedAudience(audience)
		setIsDeleteModalVisible(true)
	}

	// Подтверждение удаления аудитории
	const handleDelete = () => {
		if (selectedAudience) {
			deleteAudience(selectedAudience.id) // Удаляем аудиторию
			handleCancel() // Закрываем модальное окно
		}
	}

	// Обработка отправки формы для создания или редактирования аудитории
	const handleSubmit = async (values: any) => {
		// Преобразуем поле `capacity` в число на клиенте
		const capacity = Number(values.capacity)

		// Убедимся, что значение корректно
		if (isNaN(capacity)) {
			notification.error({
				message: 'Ошибка',
				description: 'Вместимость должна быть числом',
			})
			return
		}

		// Если редактируем аудиторию, отправляем обновленные данные
		if (selectedAudience) {
			console.log(selectedAudience)
			updateAudience({
				...values,
				id: selectedAudience.key,
				// id: selectedAudience.id,
				capacity, // Передаем значение в числовом формате
			})
		} else {
			// Если создаем новую аудиторию
			addAudience({
				...values,
				capacity, // Передаем значение в числовом формате
			})
		}

		handleCancel() // Закрываем форму после успешного добавления или обновления
	}

	// Колонки для таблицы
	const columns = [
		{
			title: 'Название аудитории',
			dataIndex: 'title',
			key: 'title',
		},
		{
			title: 'Тип',
			dataIndex: 'type',
			key: 'type',
			filters: audienceTypeList?.map(type => ({
				text: type.title,
				value: type.id,
			})),
			filteredValue: filters.type || null,
			onFilter: (value, record) => record.type === value,
		},
		{
			title: 'Здание',
			dataIndex: 'building',
			key: 'building',
			filters: buildingList?.map(building => ({
				text: building.title,
				value: building.id,
			})),
			filteredValue: filters.building || null,
			onFilter: (value, record) => record.building === value,
		},
		{
			title: 'Вместимость',
			dataIndex: 'capacity',
			key: 'capacity',
		},
		{
			title: 'Оборудование',
			dataIndex: 'equipment',
			key: 'equipment',
			render: (equipment: string) => (
				<Typography.Text>{equipment}</Typography.Text>
			),
		},
		{
			title: 'Доп. информация',
			key: 'info',
			render: (text: string, audience: any) => {
				// Показываем иконку глаза только если есть дополнительная информация
				return audience.additionalInfo ? (
					<Tooltip title='Посмотреть дополнительную информацию'>
						<Button
							type='link'
							icon={<EyeOutlined />}
							onClick={() => showInfoModal(audience)}
						/>
					</Tooltip>
				) : (
					<></> // Если информации нет, ничего не отображаем
				)
			},
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (text: string, audience: any) => (
				<>
					<Tooltip title='Редактировать'>
						<Button
							type='link'
							icon={<EditOutlined />}
							onClick={() => showEditModal(audience)}
						/>
					</Tooltip>
					<Tooltip title='Удалить'>
						<Button
							type='link'
							icon={<DeleteOutlined />}
							onClick={() => showDeleteModal(audience)}
						/>
					</Tooltip>
				</>
			),
		},
	]

	// Если данные загружаются или произошла ошибка
	if (isLoading || equipmentLoading) {
		return <Typography.Text>Загрузка...</Typography.Text>
	}

	if (error || equipmentError) {
		return (
			<Typography.Text type='danger'>
				Произошла ошибка при загрузке данных.
			</Typography.Text>
		)
	}

	// Подготовка данных для отображения в таблице
	const dataSource =
		audienceList?.map(audience => ({
			key: audience.id,
			title: audience.title,
			type:
				audienceTypeList?.find(type => type.id === audience.audienceTypeId)
					?.title || 'Неизвестно',
			building:
				buildingList?.find(building => building.id === audience.buildingId)
					?.title || 'Неизвестно',

			capacity: audience.capacity,
			equipment: audience.equipment
				? audience.equipment.map((eq: any) => eq.title).join(', ')
				: 'Нет оборудования',
			additionalInfo: audience.additionalInfo,
		})) || []

	// Подготовка списка оборудования для Select
	const equipmentOptions =
		equipmentList?.map(equipment => ({
			label: equipment.title,
			value: equipment.id,
		})) || []

	// Подготовка списка типов кабинетов для Select
	const audienceTypeOptions =
		audienceTypeList?.map(type => ({
			label: type.title,
			value: type.id,
		})) || []

	// Подготовка списка зданий для Select
	const buildingOptions =
		buildingList?.map(building => ({
			label: building.title,
			value: building.id,
		})) || []

	return (
		<>
			<h2>Просмотр аудиторий</h2>
			<Button
				type='primary'
				onClick={showModal}
				style={{ marginBottom: 16, marginTop: 16 }}
			>
				Добавить аудиторию
			</Button>

			<Table
				dataSource={dataSource}
				columns={columns}
				pagination={false}
				rowKey='key'
				onChange={(pagination, filters) => {
					setFilters({
						type: filters.type,
						building: filters.building,
					})
				}}
			/>

			{/* Модальное окно для добавления или редактирования аудитории */}
			<Modal
				title={
					selectedAudience ? 'Редактировать аудиторию' : 'Добавить аудиторию'
				}
				visible={isModalVisible || isEditModalVisible}
				onCancel={handleCancel}
				footer={null} // Скрыть стандартные кнопки Modal
			>
				<Form
					form={form}
					layout='vertical'
					onFinish={handleSubmit}
					// initialValues={{
					// 	type: 'LECTURE', // Предустановим значение типа аудитории
					// }}
				>
					<Form.Item
						label='Название аудитории'
						name='title'
						rules={[
							{
								required: true,
								message: 'Пожалуйста, введите название аудитории!',
							},
						]}
					>
						<Input />
					</Form.Item>

					<Form.Item
						label='Тип'
						name='audienceTypeId'
						rules={[
							{
								required: true,
								message: 'Пожалуйста, выберите тип аудитории!',
							},
						]}
					>
						<Select options={audienceTypeOptions}></Select>
					</Form.Item>

					<Form.Item
						label='Здание'
						name='buildingId'
						rules={[
							{ required: true, message: 'Пожалуйста, выберите здание!' },
						]}
					>
						<Select options={buildingOptions} />
					</Form.Item>

					<Form.Item
						label='Вместимость'
						name='capacity'
						rules={[
							{
								required: true,
								message: 'Пожалуйста, укажите вместимость аудитории!',
							},
						]}
					>
						<Input type='number' />
					</Form.Item>

					<Form.Item label='Дополнительная информация' name='additionalInfo'>
						<Input.TextArea rows={4} />
					</Form.Item>

					<Form.Item
						label='Оборудование'
						name='equipmentIds'
						rules={[
							{ required: true, message: 'Пожалуйста, выберите оборудование!' },
						]}
					>
						<Select mode='multiple' options={equipmentOptions} />
					</Form.Item>

					<Form.Item>
						<Button type='primary' htmlType='submit' style={{ width: '100%' }}>
							{selectedAudience ? 'Сохранить изменения' : 'Создать аудиторию'}
						</Button>
					</Form.Item>
				</Form>
			</Modal>

			{/* Модальное окно для дополнительной информации */}
			<Modal
				title='Дополнительная информация'
				visible={isInfoModalVisible}
				onCancel={handleInfoModalCancel}
				footer={null}
			>
				<Typography.Paragraph>
					{selectedAudience?.additionalInfo}
				</Typography.Paragraph>
			</Modal>

			{/* Модальное окно для подтверждения удаления */}
			<Modal
				title='Подтверждение удаления'
				visible={isDeleteModalVisible}
				onCancel={handleCancel}
				onOk={handleDelete}
				okText='Удалить'
				cancelText='Отменить'
			>
				<Typography.Paragraph>
					Вы уверены, что хотите удалить аудиторию{' '}
					<strong>{selectedAudience?.title}</strong>?
				</Typography.Paragraph>
			</Modal>
		</>
	)
}
