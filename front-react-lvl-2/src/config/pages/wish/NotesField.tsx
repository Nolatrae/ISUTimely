'use client'

import { Input } from 'antd'
import React, { memo } from 'react'

interface NotesFieldProps {
  notes: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const { TextArea } = Input

const NotesField: React.FC<NotesFieldProps> = memo(({ notes, onChange }) => {
  return (
    <div className='mt-4'>
      <div className='mb-2 font-semibold'>Пожелания / Заметки:</div>
      <TextArea
        rows={4}
        value={notes}
        onChange={onChange}
        placeholder='Введите ваши пожелания...'
      />
    </div>
  )
})

export default NotesField
