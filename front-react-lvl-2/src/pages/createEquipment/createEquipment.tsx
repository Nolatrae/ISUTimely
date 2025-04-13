import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, Table, Tooltip } from 'antd'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'

import { Field } from '@/components/ui/field/Field'
import equipmentService from '@/services/equipment/equipment.service'

interface Equipment {
	id: string
	title: string
}

export function CreateEquipment() {
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(
		null
	)
	const queryClient = useQueryClient()

	// Запрос на получение оборудования
	const {
		data: equipmentList,
		isLoading,
		error,
	} = useQuery<Equipment[]>({
		queryKey: ['equipments'],
		queryFn: () => equipmentService.getAll(),
	})

	// Мутация для добавления нового оборудования
	const { mutate: createEquipment } = useMutation({
		mutationKey: ['equipments'],
		mutationFn: async (data: { title: string }) => {
			await equipmentService.create(data)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['equipments'] })
			const { toast } = await import('react-hot-toast')
			toast.success('Сохранение прошло успешно')
		},
		async onError() {
			const { toast } = await import('react-hot-toast')
			toast.error('Сохранение провалилось')
		},
	})

	// Мутация для удаления оборудования
	const { mutate: deleteEquipment } = useMutation({
		mutationKey: ['equipments'],
		mutationFn: async (id: string) => {
			await equipmentService.delete(id)
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['equipments'] })
			const { toast } = await import('react-hot-toast')
			toast.success('Удаление успешно')
		},
		async onError() {
			const { toast } = await import('react-hot-toast')
			toast.error('Ошибка при удалении')
		},
	})

	// Мутация для обновления оборудования
	const { mutate: updateEquipment } = useMutation({
		mutationKey: ['equipments'],
		mutationFn: async (data: Equipment) => {
			if (currentEquipment) {
				await equipmentService.update(currentEquipment.id, {
					title: data.title,
				})
			}
		},
		async onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['equipments'] })
			const { toast } = await import('react-hot-toast')
			toast.success('Обновление успешно')
			setEditModalOpen(false)
		},
		async onError() {
			const { toast } = await import('react-hot-toast')
			toast.error('Ошибка при обновлении')
		},
	})

	const { register, handleSubmit, setValue, reset } = useForm<{
		title: string
	}>()

	const onSubmit: SubmitHandler<{ title: string }> = data => {
		if (currentEquipment) {
			// Если редактируем оборудование
			updateEquipment({ ...currentEquipment, title: data.title })
		} else {
			// Если создаём новое оборудование
			createEquipment(data)
		}
	}

	const handleEdit = (equipment: Equipment) => {
		setCurrentEquipment(equipment)
		setValue('title', equipment.title)
		setEditModalOpen(true)
	}

	const handleDelete = (id: string) => {
		Modal.confirm({
			title: 'Удалить оборудование?',
			onOk: () => deleteEquipment(id),
		})
	}

	// Колонки для таблицы
	const columns = [
		{
			title: 'Название оборудования',
			dataIndex: 'title',
			key: 'title',
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (_: any, record: Equipment) => (
				<>
					<Tooltip title='Редактировать'>
						<Button
							type='link'
							icon={<EditOutlined />}
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
					<Tooltip title='Удалить'>
						<Button
							type='link'
							icon={<DeleteOutlined />}
							onClick={() => handleDelete(record.id)}
						/>
					</Tooltip>
				</>
			),
		},
	]

	return (
		<>
			{/* Кнопка для создания нового оборудования */}
			<h2>Оборудование</h2>
			{/* <Button type='primary' onClick={() => openModal('create')} style={{ marginBottom: 16, marginTop: 16 }}> */}
			<Button
				type='primary'
				onClick={() => {
					reset() // Сбросим форму перед созданием нового оборудования
					setCurrentEquipment(null) // Убираем текущие данные
					setEditModalOpen(true)
				}}
				style={{ marginBottom: 16, marginTop: 16 }}
			>
				Создать оборудование
			</Button>

			{/* Таблица с оборудованием */}
			<Table
				dataSource={equipmentList}
				columns={columns}
				loading={isLoading}
				rowKey='id'
				pagination={false}
			/>

			{/* Модальное окно для создания/редактирования оборудования */}
			<Modal
				open={editModalOpen}
				onCancel={() => setEditModalOpen(false)}
				onOk={handleSubmit(onSubmit)}
				title={
					currentEquipment
						? 'Редактировать оборудование'
						: 'Создать оборудование'
				}
			>
				<Field
					label='Название оборудования'
					type='text'
					registration={register('title', {
						required: 'Название обязательно!',
					})}
					placeholder='Введите название'
				/>
			</Modal>
		</>
	)
}
