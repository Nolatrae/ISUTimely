import React, { memo } from 'react'

interface WeekToggleProps {
	isEvenWeek: boolean
	onToggle: () => void
}

const WeekToggle: React.FC<WeekToggleProps> = memo(
	({ isEvenWeek, onToggle }) => {
		return (
			<div className='flex justify-center my-4'>
				<button
					className={`px-4 py-2 rounded-l ${
						isEvenWeek ? 'bg-blue-500 text-white' : 'bg-gray-200'
					}`}
					onClick={onToggle}
				>
					Четная неделя
				</button>
				<button
					className={`px-4 py-2 rounded-r ${
						!isEvenWeek ? 'bg-blue-500 text-white' : 'bg-gray-200'
					}`}
					onClick={onToggle}
				>
					Нечетная неделя
				</button>
			</div>
		)
	}
)

export default WeekToggle
