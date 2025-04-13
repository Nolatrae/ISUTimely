'use client'

import { useProfile } from '@/hooks/useProfile'
import audienceService from '@/services/room/audience.service'
import wishesService from '@/services/wishes/wishes.service'
import { useQuery } from '@tanstack/react-query'
import { Button, message, Segmented, Table } from 'antd'
import React, { useCallback, useState } from 'react'
import GridCell from './GridCell'
import NotesField from './NotesField'
import { daysOfWeek, hoursOfDay } from './const'

const disciplines = ['Математика', 'Физика', 'Химия']

interface CellData {
	discipline?: string
	room?: string
}

const GridComponent: React.FC = () => {
	const { user } = useProfile()
	const {
		data: rooms,
		isLoading,
		error,
	} = useQuery<any[]>({
		queryKey: ['departments'],
		queryFn: () => audienceService.getAll(),
	})
	const roomTitles = rooms?.map(room => room.title) || []
	const [selectedCells, setSelectedCells] = useState<{
		even: { [key: string]: CellData }
		odd: { [key: string]: CellData }
	}>({
		even: {},
		odd: {},
	})

	const [isEvenWeek, setIsEvenWeek] = useState(true)
	const [notes, setNotes] = useState('')

	const handleCellClick = useCallback(
		(day: string, hour: string) => {
			const key = `${day}-${hour}`
			const weekKey = isEvenWeek ? 'even' : 'odd'
			setSelectedCells(prev => {
				const updatedCells = { ...prev[weekKey] }
				if (updatedCells[key]) {
					delete updatedCells[key]
				} else {
					updatedCells[key] = {}
				}
				return { ...prev, [weekKey]: updatedCells }
			})
		},
		[isEvenWeek]
	)

	const handleOptionClick = useCallback(
		(
			option: string,
			day: string,
			hour: string,
			type: 'discipline' | 'room'
		) => {
			const key = `${day}-${hour}`
			const weekKey = isEvenWeek ? 'even' : 'odd'
			setSelectedCells(prev => ({
				...prev,
				[weekKey]: {
					...prev[weekKey],
					[key]: {
						...prev[weekKey][key],
						[type]: option,
					},
				},
			}))
		},
		[isEvenWeek]
	)

	const handleSegmentedChange = useCallback((val: string | number) => {
		setIsEvenWeek(val === 'even')
	}, [])

	const handleSave = useCallback(() => {
		message.success('Ваши пожелания успешно отправлены!')
		wishesService.sendWishes(user.id, selectedCells, notes)
	}, [selectedCells, notes])

	const handleNotesChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setNotes(e.target.value)
		},
		[]
	)

	const currentWeekKey = isEvenWeek ? 'even' : 'odd'

	const columns = [
		{
			title: 'Время',
			dataIndex: 'hour',
			key: 'hour',
			align: 'center',
			width: 100,
		},
		...daysOfWeek.map(day => ({
			title: day,
			dataIndex: day,
			key: day,
			align: 'center',
			width: `${100 / daysOfWeek.length}%`,
			render: (_: any, record: { hour: string }) => {
				const key = `${day}-${record.hour}`
				return (
					<GridCell
						day={day}
						hour={record.hour}
						disciplines={disciplines}
						rooms={roomTitles}
						selectedOption={selectedCells[currentWeekKey]?.[key]}
						onCellClick={handleCellClick}
						onOptionClick={handleOptionClick}
					/>
				)
			},
		})),
	]

	const dataSource = hoursOfDay.map(hour => ({ key: hour, hour }))

	return (
		<div>
			<Segmented
				options={[
					{ label: 'Чётная неделя', value: 'even' },
					{ label: 'Нечётная неделя', value: 'odd' },
				]}
				value={isEvenWeek ? 'even' : 'odd'}
				onChange={handleSegmentedChange}
				className='mb-4 mt-4'
			/>

			<Table
				bordered
				columns={columns}
				dataSource={dataSource}
				pagination={false}
				size='middle'
				className='mb-4'
			/>

			<NotesField notes={notes} onChange={handleNotesChange} />

			<Button type='primary' onClick={handleSave} className='mt-2'>
				Сохранить
			</Button>
		</div>
	)
}

export default GridComponent
