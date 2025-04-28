import { disciplineService } from '@/services/disciplines/discipline.service'
import groupService from '@/services/group/group.service'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Checkbox, Input, List, Select } from 'antd'
import { useState } from 'react'

const { Option } = Select

interface Group {
	id: string
	title: string
}

interface CommonDiscipline {
	id: string
	title: string
	type: 'lecture' | 'practice'
	groups?: { id: string }[]
}

export function DisciplineGroupAssignment() {
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
	const [commonDisciplines, setCommonDisciplines] = useState<
		CommonDiscipline[]
	>([])
	const [selectedDisciplineIds, setSelectedDisciplineIds] = useState<string[]>(
		[]
	)

	const { data: groupsData, isLoading: isGroupLoading } = useQuery<Group[]>({
		queryKey: ['groups'],
		queryFn: () => groupService.getAll(),
	})

	// Запрос на получение общих дисциплин (объекты с { id, title, type, groups })
	const { mutate: fetchCommonDisciplines, isPending } = useMutation({
		mutationFn: () =>
			disciplineService.getCommonDisciplines(selectedGroupIds, selectedNumber!),
		onSuccess: data => {
			// data ожидается как массив объектов { id, title, type, groups? }
			setCommonDisciplines(data)
			// Если в записи уже есть привязанные группы, помечаем её как выбранную
			const preSelected = data
				.filter((d: any) => d.groups && d.groups.length > 0)
				.map((d: any) => d.id)
			setSelectedDisciplineIds(preSelected)
		},
		onError: error => {
			console.error('Ошибка загрузки дисциплин:', error)
		},
	})

	// Мутация для отправки выбранных дисциплин на сервер (связь с группами)
	const { mutate: sendSelectedDisciplines, isLoading: isSubmitting } =
		useMutation({
			mutationFn: () =>
				disciplineService.sendSelectedDisciplines(
					selectedDisciplineIds,
					selectedGroupIds,
					selectedNumber!
				),
			onSuccess: () => {
				console.log('Дисциплины успешно отправлены')
			},
			onError: error => {
				console.error('Ошибка отправки дисциплин:', error)
			},
		})

	const handleCheckboxChange = (disciplineId: string, checked: boolean) => {
		setSelectedDisciplineIds(prev =>
			checked ? [...prev, disciplineId] : prev.filter(id => id !== disciplineId)
		)
	}

	return (
		<div style={{ padding: 20 }}>
			<h2 className='text-black mb-4'>Общие дисциплины для выбранных групп</h2>
			{/* Фильтры и кнопки в одной строке */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '16px',
					marginBottom: '16px',
				}}
			>
				<Select
					mode='multiple'
					style={{ minWidth: 300 }}
					placeholder='Выберите группы для анализа'
					value={selectedGroupIds}
					onChange={(value: string[]) => setSelectedGroupIds(value)}
					loading={isGroupLoading}
				>
					{groupsData?.map(
						group =>
							group && (
								<Option key={group.id} value={group.id}>
									{group.title}
								</Option>
							)
					)}
				</Select>

				<Select
					style={{ minWidth: 100 }}
					placeholder='Номер'
					value={selectedNumber || undefined}
					onChange={value => setSelectedNumber(value)}
				>
					{Array.from({ length: 8 }, (_, i) => (
						<Option key={i + 1} value={i + 1}>
							{i + 1}
						</Option>
					))}
				</Select>

				<Input
					style={{ width: 300 }}
					placeholder='Поиск по дисциплине'
					onChange={e => {}}
				/>

				<Button
					type='primary'
					onClick={() => fetchCommonDisciplines()}
					disabled={!selectedNumber || selectedGroupIds.length < 2 || isPending}
				>
					{isPending ? 'Загрузка...' : 'Применить фильтры'}
				</Button>

				<Button
					type='primary'
					onClick={() => sendSelectedDisciplines()}
					disabled={selectedDisciplineIds.length === 0 || isSubmitting}
				>
					{isSubmitting ? 'Отправка...' : 'Сохранить изменения'}
				</Button>
			</div>

			{selectedGroupIds.length < 2 ? (
				<Alert
					message='Выберите минимум 2 группы для анализа общих дисциплин'
					type='info'
				/>
			) : commonDisciplines.length === 0 ? (
				<Alert
					message='Нет общих дисциплин для выбранных групп'
					type='warning'
				/>
			) : (
				<List
					bordered
					dataSource={commonDisciplines}
					renderItem={(item: CommonDiscipline) => (
						<List.Item
							actions={[
								<Checkbox
									checked={selectedDisciplineIds.includes(item.id)}
									onChange={e =>
										handleCheckboxChange(item.id, e.target.checked)
									}
								>
									Объединить
								</Checkbox>,
							]}
						>
							<span>
								<span
									style={{ color: item.type === 'lecture' ? 'blue' : 'red' }}
								>
									{item.type === 'lecture' ? 'Л' : 'П'}
								</span>
								<span> | </span>
								{item.title}
							</span>
						</List.Item>
					)}
				/>
			)}
		</div>
	)
}
