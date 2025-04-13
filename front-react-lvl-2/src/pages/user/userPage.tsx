import departmentsService from '@/services/department/departments.service'
import positionService from '@/services/positions/position.service'
import usersService from '@/services/user/users.service'
import {
	DeleteOutlined,
	EditOutlined,
	FileWordOutlined,
	SearchOutlined,
	SyncOutlined,
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
import {
	Document,
	Table as DocxTable,
	Packer,
	Paragraph,
	TableCell,
	TableLayoutType,
	TableRow,
} from 'docx'
import { saveAs } from 'file-saver'
import { useState } from 'react'

interface User {
	id: string
	login: string
	firstName: string
	lastName: string
	role: 'USER' | 'ADMIN' | 'TEACHER'
	tempPassword?: string
	teacher?: {
		id: string
		positionId: string
		departmentId: string
	}
}

interface Department {
	id: string
	title: string
}

interface Position {
	id: string
	title: string
}

export function UserPage() {
	const queryClient = useQueryClient()
	const [currentUser, setCurrentUser] = useState<User | null>(null)
	const [selectedRole, setSelectedRole] = useState<
		'USER' | 'ADMIN' | 'TEACHER'
	>('USER')
	const [searchText, setSearchText] = useState('')
	const [form] = Form.useForm()

	// **Состояние модальных окон**
	const [modalState, setModalState] = useState<
		'create' | 'edit' | 'delete' | null
	>(null)

	// **Запрос списка пользователей**
	const {
		data: usersData,
		isLoading,
		error,
	} = useQuery<User[]>({
		queryKey: ['users'],
		queryFn: async () => {
			const users = await usersService.getAll()
			return users.map(user => ({
				...user,
				role: user.role || user.rights,
				teacher: user.Teacher,
			}))
		},
	})

	// **Запрос списка кафедр**
	const { data: departmentsData, isLoading: departmentsLoading } = useQuery<
		Department[]
	>({
		queryKey: ['departments'],
		queryFn: () => departmentsService.getAll(),
	})

	// **Запрос списка должностей**
	const { data: positionsData, isLoading: positionsLoading } = useQuery<
		Position[]
	>({
		queryKey: ['positions'],
		queryFn: () => positionService.getAll(),
	})

	// **Открытие модального окна**
	const openModal = (type: 'create' | 'edit' | 'delete', user?: User) => {
		setCurrentUser(user || null)
		setModalState(type)

		if (type === 'create') {
			form.resetFields()
			setSelectedRole('USER')
		} else if (type === 'edit' && user) {
			form.setFieldsValue({
				firstName: user.firstName,
				middleName: user.middleName,
				lastName: user.lastName,
				role: user.role,
				positionId: user.teacher?.positionId,
				departmentId: user.teacher?.departmentId,
			})
			setSelectedRole(user.role)
		}
	}

	// **Закрытие всех модальных окон**
	const handleCancel = () => {
		setModalState(null)
		setCurrentUser(null)
	}

	// **Создание пользователя**
	const { mutate: addUser } = useMutation({
		mutationKey: ['users'],
		mutationFn: async (data: {
			firstName: string
			lastName: string
			role: 'USER' | 'ADMIN' | 'TEACHER'
			positionId?: string
			departmentId?: string
		}) => {
			await usersService.create(data)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['users'] })
			notification.success({ message: 'Пользователь успешно добавлен' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при добавлении пользователя' })
		},
	})

	// **Сброс временного пароля**
	const { mutate: resetTempPassword } = useMutation({
		mutationKey: ['users'],
		mutationFn: async (id: string) => {
			const user = await usersService.resetTempPassword(id)
			return user
		},
		async onSuccess(user) {
			queryClient.invalidateQueries({ queryKey: ['users'] })
			notification.success({
				message: 'Временный пароль сброшен',
				description: `Новый пароль: ${user.tempPassword}`,
			})
		},
		async onError() {
			notification.error({ message: 'Ошибка при сбросе временного пароля' })
		},
	})

	// **Удаление пользователя**
	const { mutate: deleteUser } = useMutation({
		mutationKey: ['users'],
		mutationFn: async (id: string) => {
			await usersService.delete(id)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['users'] })
			notification.success({ message: 'Пользователь успешно удалён' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при удалении пользователя' })
		},
	})

	// **Обновление пользователя**
	const { mutate: updateUser } = useMutation({
		mutationKey: ['users'],
		mutationFn: async ({
			id,
			firstName,
			lastName,
			role,
			positionId,
			departmentId,
		}: {
			id: string
			firstName: string
			lastName: string
			role: 'USER' | 'ADMIN' | 'TEACHER'
			positionId?: string
			departmentId?: string
		}) => {
			await usersService.update(id, {
				firstName,
				lastName,
				role,
				positionId,
				departmentId,
			})
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['users'] })
			notification.success({ message: 'Пользователь успешно обновлён' })
			handleCancel()
		},
		async onError() {
			notification.error({ message: 'Ошибка при обновлении пользователя' })
		},
	})

	// **Обработка удаления пользователя**
	const handleDelete = () => {
		if (currentUser) {
			deleteUser(currentUser.id)
		}
	}

	// **Обработка отправки формы**
	const handleSubmit = async (values: {
		firstName: string
		lastName: string
		role: 'USER' | 'ADMIN' | 'TEACHER'
	}) => {
		if (currentUser) {
			updateUser({ id: currentUser.id, ...values })
		} else {
			addUser(values)
		}
	}

	const [filters, setFilters] = useState({
		role: [] as string[],
		department: [] as string[],
		position: [] as string[],
	})

	// **Обновление фильтров**
	const handleFilterChange = (key: keyof typeof filters, value: string[]) => {
		setFilters(prev => ({ ...prev, [key]: value }))
	}

	// **Отфильтрованные данные**
	const filteredUsers = usersData?.filter(user => {
		const matchesRole =
			filters.role.length === 0 || filters.role.includes(user.role)
		const matchesDepartment =
			filters.department.length === 0 ||
			(user.teacher && filters.department.includes(user.teacher.departmentId))
		const matchesPosition =
			filters.position.length === 0 ||
			(user.teacher && filters.position.includes(user.teacher.positionId))
		// Добавляем проверку по фамилии (регистр не важен)
		const matchesSearch =
			searchText.trim() === '' ||
			user.lastName.toLowerCase().includes(searchText.trim().toLowerCase())

		return matchesRole && matchesDepartment && matchesPosition && matchesSearch
	})

	const handleSaveToWord = () => {
		if (!usersData) {
			notification.error({ message: 'Нет данных для сохранения' })
			return
		}

		// Формируем заголовки таблицы
		const tableRows = [
			new TableRow({
				children: ['Имя', 'Фамилия', 'Временный пароль'].map(
					text =>
						new TableCell({
							children: [new Paragraph({ text, bold: true })],
						})
				),
			}),
		]

		// Добавляем строки с данными пользователей
		usersData.forEach(user => {
			tableRows.push(
				new TableRow({
					children: [
						new TableCell({ children: [new Paragraph(user.firstName)] }),
						new TableCell({ children: [new Paragraph(user.lastName)] }),
						new TableCell({
							children: [new Paragraph(user.tempPassword || '—')],
						}),
					],
				})
			)
		})

		// Создаем документ Word с таблицей, используя `AUTO` для автоматической ширины
		const doc = new Document({
			sections: [
				{
					properties: {},
					children: [
						new DocxTable({
							rows: tableRows,
							layout: TableLayoutType.AUTO, // Позволяет Word самому растянуть столбцы
						}),
					],
				},
			],
		})

		// Генерируем и сохраняем файл
		Packer.toBlob(doc).then(blob => {
			saveAs(blob, 'Пользователи.docx')
		})
	}

	// **Столбцы таблицы**
	const columns = [
		{
			title: 'Фамилия',
			dataIndex: 'lastName',
			key: 'lastName',
			sorter: (a: User, b: User) => a.lastName.localeCompare(b.lastName),
		},
		{ title: 'Имя', dataIndex: 'firstName', key: 'firstName' },
		{ title: 'Отчество', dataIndex: 'middleName', key: 'middleName' },
		{
			title: 'Роль',
			dataIndex: 'role',
			key: 'role',
			filters: [
				{ text: 'Пользователь', value: 'USER' },
				{ text: 'Администратор', value: 'ADMIN' },
				{ text: 'Преподаватель', value: 'TEACHER' },
			],
			onFilter: (value, record) => record.role === value,
			render: (role: string) => (
				<span
					style={{
						fontWeight: 'bold',
						color:
							role === 'ADMIN' ? 'red' : role === 'TEACHER' ? 'blue' : 'black',
					}}
				>
					{role}
				</span>
			),
		},
		{
			title: 'Кафедра',
			dataIndex: 'teacher',
			key: 'department',
			filters:
				departmentsData?.map(dep => ({ text: dep.title, value: dep.id })) || [],
			onFilter: (value, record) => record.teacher?.departmentId === value,
			render: teacher =>
				teacher
					? departmentsData?.find(dep => dep.id === teacher.departmentId)
							?.title || '—'
					: '—',
		},
		{
			title: 'Должность',
			dataIndex: 'teacher',
			key: 'position',
			filters:
				positionsData?.map(pos => ({ text: pos.title, value: pos.id })) || [],
			onFilter: (value, record) => record.teacher?.positionId === value,
			render: teacher =>
				teacher
					? positionsData?.find(pos => pos.id === teacher.positionId)?.title ||
					  '—'
					: '—',
		},
		{ title: 'Логин', dataIndex: 'login', key: 'login' },
		{
			title: 'Временный пароль',
			dataIndex: 'tempPassword',
			key: 'tempPassword',
			render: tempPassword => tempPassword || '—',
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (_, user: User) => (
				<>
					<Tooltip title='Редактировать'>
						<Button
							type='link'
							icon={<EditOutlined />}
							onClick={() => openModal('edit', user)}
						/>
					</Tooltip>
					<Tooltip title='Сбросить временный пароль'>
						<Button
							type='link'
							icon={<SyncOutlined />}
							onClick={() => resetTempPassword(user.id)}
						/>
					</Tooltip>
					<Tooltip title='Удалить'>
						<Button
							type='link'
							icon={<DeleteOutlined />}
							onClick={() => openModal('delete', user)}
						/>
					</Tooltip>
				</>
			),
		},
	]

	// **Загрузка или ошибка**
	if (isLoading) return <Typography.Text>Загрузка...</Typography.Text>
	if (error)
		return (
			<Typography.Text type='danger'>
				Произошла ошибка при загрузке данных.
			</Typography.Text>
		)

	return (
		<>
			<h2>Пользователи</h2>
			<Button
				type='primary'
				onClick={() => openModal('create')}
				style={{ marginBottom: 16, marginTop: 16, marginRight: 16 }}
			>
				Добавить пользователя
			</Button>
			<Button
				type='default'
				icon={<FileWordOutlined />}
				onClick={handleSaveToWord}
				style={{ marginBottom: 16, marginRight: 16 }}
			>
				Сохранить в Word
			</Button>
			{/* **Поиск по фамилии** */}

			<Input
				placeholder='Поиск по фамилии'
				prefix={<SearchOutlined />}
				value={searchText}
				onChange={e => setSearchText(e.target.value)}
				style={{ marginBottom: 16, width: 300 }}
			/>
			<Table
				dataSource={filteredUsers}
				columns={columns}
				pagination={false}
				rowKey='id'
			/>

			{/* **Модальное окно для создания/редактирования** */}
			{/* **Модальное окно для создания/редактирования** */}
			<Modal
				title={
					modalState === 'edit'
						? 'Редактировать пользователя'
						: 'Добавить пользователя'
				}
				open={modalState === 'create' || modalState === 'edit'}
				onCancel={handleCancel}
				footer={null}
			>
				<Form form={form} layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						label='Имя'
						name='firstName'
						rules={[{ required: true, message: 'Введите имя!' }]}
					>
						<Input />
					</Form.Item>
					<Form.Item
						label='Отчество'
						name='middleName'
						rules={[{ required: false }]}
					>
						<Input />
					</Form.Item>
					<Form.Item
						label='Фамилия'
						name='lastName'
						rules={[{ required: true, message: 'Введите фамилию!' }]}
					>
						<Input />
					</Form.Item>
					<Form.Item
						label='Роль'
						name='role'
						rules={[{ required: true, message: 'Выберите роль!' }]}
					>
						<Select
							value={selectedRole}
							onChange={value => setSelectedRole(value)}
						>
							<Select.Option value='USER'>Пользователь</Select.Option>
							<Select.Option value='ADMIN'>Администратор</Select.Option>
							<Select.Option value='TEACHER'>Преподаватель</Select.Option>
						</Select>
					</Form.Item>
					{/* Отображаем специфичные поля, если роль TEACHER */}
					{selectedRole === 'TEACHER' && (
						<>
							<Form.Item label='Должность' name='positionId'>
								<Select loading={positionsLoading}>
									{positionsData?.map(pos => (
										<Select.Option key={pos.id} value={pos.id}>
											{pos.title}
										</Select.Option>
									))}
								</Select>
							</Form.Item>
							<Form.Item label='Кафедра' name='departmentId'>
								<Select loading={departmentsLoading}>
									{departmentsData?.map(dep => (
										<Select.Option key={dep.id} value={dep.id}>
											{dep.title}
										</Select.Option>
									))}
								</Select>
							</Form.Item>
						</>
					)}
					<Button type='primary' htmlType='submit'>
						Сохранить
					</Button>
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
					Вы уверены, что хотите удалить пользователя{' '}
					<strong>
						{currentUser?.firstName} {currentUser?.lastName}
					</strong>
					?
				</Typography.Paragraph>
			</Modal>
		</>
	)
}
