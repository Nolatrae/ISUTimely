import { translateRoles } from '@/components/utils/translateRoles'
import { useProfile } from '@/hooks/useProfile'
import departmentsService from '@/services/department/departments.service'
import positionService from '@/services/positions/position.service'
import usersService from '@/services/user/users.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	Button,
	Card,
	Col,
	Form,
	Input,
	Modal,
	notification,
	Row,
	Select,
	Spin,
	Typography,
} from 'antd'
import { useState } from 'react'

export function UserProfile() {
	const { user, isLoading } = useProfile()
	const queryClient = useQueryClient()

	console.log(user?.rights[0])

	// Запрос на все должности
	const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
		queryKey: ['positions'],
		queryFn: () => positionService.getAll(),
		enabled: !!user?.Teacher?.positionId,
	})

	// Запрос на все кафедры
	const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
		queryKey: ['departments'],
		queryFn: () => departmentsService.getAll(),
		enabled: !!user?.Teacher?.departmentId,
	})

	// Состояние для редактирования профиля
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [form] = Form.useForm()

	// Состояние для модального окна смены пароля
	const [passwordModalOpen, setPasswordModalOpen] = useState(false)
	const [passwordForm] = Form.useForm()

	// Мутация для обновления данных пользователя
	const updateUserMutation = useMutation({
		mutationKey: ['updateUser'],
		mutationFn: async (updatedData: any) => {
			const { id, ...restData } = updatedData
			await usersService.updateProfile(id, restData)
		},
		onSuccess() {
			notification.success({ message: 'Данные успешно обновлены' })
			// Обновляем данные профиля в кеше, чтобы сразу видеть изменения
			queryClient.invalidateQueries(['profile'])
			setEditModalOpen(false)
		},
		onError() {
			notification.error({ message: 'Ошибка при обновлении данных' })
		},
	})

	// Мутация для смены пароля
	const changePasswordMutation = useMutation({
		mutationKey: ['changePassword'],
		mutationFn: async (data: {
			id: string
			oldPassword: string
			newPassword: string
		}) => {
			await usersService.changePassword(
				data.id,
				data.oldPassword,
				data.newPassword
			)
		},
		onSuccess() {
			notification.success({ message: 'Пароль успешно изменён' })
			setPasswordModalOpen(false)
			passwordForm.resetFields()
		},
		onError(err: any) {
			notification.error({
				message: err.response?.data?.message || 'Ошибка при смене пароля',
			})
		},
	})

	if (isLoading || isLoadingPositions || isLoadingDepartments) {
		return (
			<div className='centered'>
				<Spin size='large' />
			</div>
		)
	}

	// Проверка на наличие данных должности и департамента
	const positionTitle =
		positionsData?.find(position => position.id === user?.Teacher?.positionId)
			?.title || ''

	const departmentTitle =
		departmentsData?.find(
			department => department.id === user?.Teacher?.departmentId
		)?.title || ''

	const handleEdit = () => {
		form.setFieldsValue({
			firstName: user?.firstName,
			middleName: user?.middleName,
			lastName: user?.lastName,
			positionId: user?.Teacher?.positionId,
			departmentId: user?.Teacher?.departmentId,
		})
		setEditModalOpen(true)
	}

	const handleSubmit = (values: any) => {
		updateUserMutation.mutate({
			id: user?.id,
			firstName: values.firstName,
			middleName: values.middleName,
			lastName: values.lastName,
			positionId: values.positionId,
			departmentId: values.departmentId,
		})
	}

	const handlePasswordSubmit = (values: any) => {
		changePasswordMutation.mutate({
			id: user?.id,
			oldPassword: values.oldPassword,
			newPassword: values.newPassword,
		})
	}

	return (
		<div>
			<Typography.Title level={2}>Личный профиль</Typography.Title>

			{/* Основная информация */}
			<Row gutter={16}>
				<Col span={24}>
					<Card title='Основная информация' bordered>
						<Typography.Paragraph>
							<strong>Логин:</strong> {user?.login}
						</Typography.Paragraph>
						<Typography.Paragraph>
							<strong>Имя:</strong> {user?.firstName}
						</Typography.Paragraph>
						<Typography.Paragraph>
							<strong>Отчество:</strong> {user?.middleName || ''}
						</Typography.Paragraph>
						<Typography.Paragraph>
							<strong>Фамилия:</strong> {user?.lastName}
						</Typography.Paragraph>
					</Card>
				</Col>
			</Row>

			{/* Роли и доступ */}
			<Row gutter={16} style={{ marginTop: 16 }}>
				<Col span={24}>
					<Card title='Роли и доступ' bordered>
						<Typography.Paragraph>
							<strong>Права:</strong> {translateRoles(user?.rights.join(', '))}
						</Typography.Paragraph>
					</Card>
				</Col>
			</Row>

			{/* Данные преподавателя */}
			<Row gutter={16} style={{ marginTop: 16 }}>
				<Col span={24}>
					<Card title='Данные преподавателя' bordered>
						<Typography.Paragraph>
							<strong>Должность:</strong> {positionTitle}
						</Typography.Paragraph>
						<Typography.Paragraph>
							<strong>Отдел:</strong> {departmentTitle}
						</Typography.Paragraph>
					</Card>
				</Col>
			</Row>

			<Row className='mb-4 mt-4' justify='end' gutter={16}>
				<Col>
					<Button type='primary' onClick={handleEdit}>
						Редактировать
					</Button>
				</Col>
				<Col>
					<Button onClick={() => setPasswordModalOpen(true)}>
						Сменить пароль
					</Button>
				</Col>
			</Row>

			{/* Модальное окно для редактирования профиля */}
			<Modal
				open={editModalOpen}
				onCancel={() => setEditModalOpen(false)}
				footer={null}
				title='Редактировать профиль'
			>
				<Form form={form} layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						label='Имя'
						name='firstName'
						rules={[{ required: true, message: 'Пожалуйста, введите имя!' }]}
					>
						<Input />
					</Form.Item>

					<Form.Item label='Отчество' name='middleName'>
						<Input />
					</Form.Item>

					<Form.Item
						label='Фамилия'
						name='lastName'
						rules={[
							{ required: true, message: 'Пожалуйста, введите фамилию!' },
						]}
					>
						<Input />
					</Form.Item>

					<Form.Item
						label='Должность'
						name='positionId'
						rules={[
							{ required: true, message: 'Пожалуйста, выберите должность!' },
						]}
					>
						<Select placeholder='Выберите должность'>
							{positionsData?.map(position => (
								<Select.Option key={position.id} value={position.id}>
									{position.title}
								</Select.Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						label='Отдел'
						name='departmentId'
						rules={[{ required: true, message: 'Пожалуйста, выберите отдел!' }]}
					>
						<Select placeholder='Выберите отдел'>
							{departmentsData?.map(department => (
								<Select.Option key={department.id} value={department.id}>
									{department.title}
								</Select.Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item>
						<Button type='primary' htmlType='submit' style={{ width: '100%' }}>
							Сохранить изменения
						</Button>
					</Form.Item>
				</Form>
			</Modal>

			{/* Модальное окно для смены пароля */}
			<Modal
				open={passwordModalOpen}
				onCancel={() => setPasswordModalOpen(false)}
				footer={null}
				title='Сменить пароль'
			>
				<Form
					form={passwordForm}
					layout='vertical'
					onFinish={handlePasswordSubmit}
				>
					<Form.Item
						label='Старый пароль'
						name='oldPassword'
						rules={[
							{ required: true, message: 'Пожалуйста, введите старый пароль!' },
						]}
					>
						<Input.Password />
					</Form.Item>
					<Form.Item
						label='Новый пароль'
						name='newPassword'
						rules={[
							{ required: true, message: 'Пожалуйста, введите новый пароль!' },
						]}
					>
						<Input.Password />
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' style={{ width: '100%' }}>
							Сменить пароль
						</Button>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}
