import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	Button,
	Card,
	DatePicker,
	Form,
	Input,
	message,
	Modal,
	Segmented,
	Select,
	Space,
	Table,
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import React, { useMemo, useState } from 'react'

import holidayService, {
	HolidayDto,
	RecurringHolidayDto,
} from '@/services/holiday/holiday.service'
import audienceService from '@/services/room/audience.service'

import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export const hoursOfDay: string[] = [
	'08:30 — 10:00',
	'10:10 — 11:40',
	'11:50 — 13:20',
	'13:50 — 15:20',
	'15:30 — 17:00',
	'17:10 — 18:40',
	'18:50 — 20:20',
]

const ruDayOfWeek: Record<string, string> = {
	MON: 'Понедельник',
	TUE: 'Вторник',
	WED: 'Среда',
	THU: 'Четверг',
	FRI: 'Пятница',
	SAT: 'Суббота',
	SUN: 'Воскресенье',
}

const dateFormat = 'DD.MM.YYYY'

interface HolidayPairDto {
	id: string
	dayOfWeek: string
	timeSlotId: string
	isHoliday: boolean
	holidayName: string
	academicWeek: {
		id: string
		startDate: string
		endDate: string
		weekNumber: number
		weekType: string
	}
	timeSlot: {
		id: string
		title: string
		start: string
		end: string
	}
	rooms: Array<{
		audience: { id: string; title: string }
	}>
}

export const AddHolidayPage: React.FC = () => {
	const qc = useQueryClient()
	const [modalOpen, setModalOpen] = useState(false)
	const [eventType, setEventType] = useState<'one-time' | 'recurring'>(
		'one-time'
	)
	const [form] = Form.useForm()
	const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
		null,
		null,
	])

	const { data: rooms = [], isLoading: roomsLoading } = useQuery({
		queryKey: ['rooms'],
		queryFn: () => audienceService.getAll(),
	})
	const mutation = useMutation({
		mutationFn: async (dto: HolidayDto | RecurringHolidayDto) => {
			if (eventType === 'one-time') {
				await holidayService.createOneTimeHoliday(dto as HolidayDto)
			} else {
				await holidayService.createRecurringHoliday(dto as RecurringHolidayDto)
			}
		},
		onSuccess: () => {
			message.success('Праздник успешно сохранён')
			qc.invalidateQueries({ queryKey: ['holidays'] })
			setModalOpen(false)
			form.resetFields()
			setEventType('one-time')
		},
		onError: () => {
			message.error('Ошибка при сохранении праздника')
		},
	})

	const { data: holidays = [], isFetching: holidaysLoading } = useQuery({
		queryKey: ['holidays'],
		queryFn: () => holidayService.getHolidays(),
	})

	const onFinish = (values: any) => {
		const { name, roomId, timeSlots } = values

		if (eventType === 'one-time') {
			const date = values.date as Dayjs
			const dto: HolidayDto = {
				date: date.toISOString(),
				name,
				roomId,
				timeSlots,
			}
			mutation.mutate(dto)
		} else {
			const [start, end] = values.dateRange as [Dayjs, Dayjs]
			const jsDay = start.day() // 0=вс, 1=пн...
			const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
			const dayOfWeek = weekDays[jsDay]

			const dto: RecurringHolidayDto = {
				startDate: start.toISOString(),
				endDate: end.toISOString(),
				dayOfWeek,
				name,
				roomId,
				timeSlots,
			}
			mutation.mutate(dto)
		}
	}

	// Функция для получения "реальной" даты праздника из academicWeek и dayOfWeek
	const getHolidayDate = (row: HolidayPairDto): Dayjs => {
		const weekStart = dayjs(row.academicWeek.startDate)
		const jsDay =
			{ MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0 }[
				row.dayOfWeek
			] ?? 1
		return weekStart.add(jsDay === 0 ? 6 : jsDay - 1, 'day')
	}

	const filteredHolidays = useMemo(() => {
		if (!dateRange || !dateRange[0] || !dateRange[1]) return holidays
		return holidays.filter((row: any) => {
			const date = dayjs(getHolidayDate(row))
			return (
				date.isSameOrAfter(dateRange[0], 'day') &&
				date.isSameOrBefore(dateRange[1], 'day')
			)
		})
	}, [holidays, dateRange])

	const columns = useMemo(
		() => [
			{
				title: 'Дата',
				dataIndex: 'date',
				key: 'date',
				width: 130,
				render: (_: any, row: HolidayPairDto) => {
					const date = getHolidayDate(row)
					return (
						<>
							<div>{date.format('DD.MM.YYYY')}</div>
							<div className='text-gray-500 text-xs'>
								{ruDayOfWeek[row.dayOfWeek] || row.dayOfWeek}
							</div>
						</>
					)
				},
			},
			{
				title: 'Название праздника',
				dataIndex: 'holidayName',
				key: 'holidayName',
				width: 180,
			},
			{
				title: 'Время',
				dataIndex: 'timeSlot',
				key: 'timeSlot',
				width: 120,
				render: (_: any, row: HolidayPairDto) => (
					<span>{row.timeSlot?.title}</span>
				),
			},
			{
				title: 'Кабинет',
				dataIndex: 'rooms',
				key: 'rooms',
				width: 120,
				render: (rooms: HolidayPairDto['rooms']) =>
					rooms && rooms.length ? (
						rooms.map(r => r.audience?.title).join(', ')
					) : (
						<span style={{ color: '#999' }}>—</span>
					),
			},
		],
		[]
	)

	return (
		<>
			<h2>Модуль добавления праздников</h2>

			<Space className='my-4' wrap>
				<Button type='primary' onClick={() => setModalOpen(true)}>
					Добавить праздник
				</Button>
				<DatePicker.RangePicker
					style={{ minWidth: 280 }}
					format={dateFormat}
					value={dateRange}
					onChange={val => setDateRange(val ?? [null, null])}
					allowEmpty={[true, true]}
					placeholder={['Начало периода', 'Конец периода']}
				/>
			</Space>

			<Modal
				title='Добавить праздник'
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				footer={null}
				destroyOnClose
			>
				<Segmented
					options={[
						{ label: 'Разовое', value: 'one-time' },
						{ label: 'Постоянное', value: 'recurring' },
					]}
					value={eventType}
					onChange={val => setEventType(val as 'one-time' | 'recurring')}
					className='mb-4'
				/>
				<Form
					form={form}
					layout='vertical'
					onFinish={onFinish}
					initialValues={{
						timeSlots: [] /*, dateRange: [null, null] (необязательно)*/,
					}}
				>
					{eventType === 'one-time' ? (
						<Form.Item
							name='date'
							label='Дата праздника'
							rules={[{ required: true, message: 'Выберите дату' }]}
						>
							<DatePicker style={{ width: '100%' }} format={dateFormat} />
						</Form.Item>
					) : (
						<Form.Item
							name='dateRange'
							label='Период праздника'
							rules={[{ required: true, message: 'Выберите период' }]}
						>
							<DatePicker.RangePicker
								style={{ width: '100%' }}
								format={dateFormat}
								allowEmpty={[false, false]}
							/>
						</Form.Item>
					)}

					<Form.Item
						name='name'
						label='Название праздника'
						rules={[{ required: true, message: 'Введите название' }]}
					>
						<Input placeholder="Например, 'Новогодний праздник'" />
					</Form.Item>

					<Form.Item name='roomId' label='Кабинет (по желанию)'>
						<Select
							placeholder='Выберите кабинет'
							loading={roomsLoading}
							allowClear
							showSearch
							optionFilterProp='label'
							options={rooms.map(r => ({ value: r.id, label: r.title }))}
						/>
					</Form.Item>

					<Form.Item
						name='timeSlots'
						label='Таймслоты (можно выбрать несколько)'
						rules={[
							{ required: true, message: 'Выберите хотя бы один таймслот' },
						]}
					>
						<Select
							mode='multiple'
							placeholder='Выберите таймслоты'
							options={hoursOfDay.map(h => ({ value: h, label: h }))}
						/>
					</Form.Item>
					<Form.Item>
						<Button
							type='primary'
							htmlType='submit'
							loading={mutation.isLoading}
							style={{ width: '100%' }}
						>
							Сохранить
						</Button>
					</Form.Item>
				</Form>
			</Modal>

			<Card type='inner' bodyStyle={{ padding: 0 }}>
				<Table
					dataSource={filteredHolidays}
					columns={columns}
					rowKey={(r: any) => r.id}
					loading={holidaysLoading}
					pagination={false}
					scroll={{ x: 'max-content' }}
				/>
			</Card>
		</>
	)
}

export default AddHolidayPage
