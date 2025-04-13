import React, { memo } from 'react'

interface SaveButtonProps {
	onSave: () => void
}

const SaveButton: React.FC<SaveButtonProps> = memo(({ onSave }) => {
	return (
		<button
			className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
			onClick={onSave}
		>
			Сохранить изменения
		</button>
	)
})

export default SaveButton
