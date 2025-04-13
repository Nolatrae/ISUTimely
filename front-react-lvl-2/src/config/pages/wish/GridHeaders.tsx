import React, { memo } from 'react'

interface GridHeadersProps {
  daysOfWeek: string[]
}

const GridHeaders: React.FC<GridHeadersProps> = memo(({ daysOfWeek }) => {
  return (
    <>
      {daysOfWeek.map((day, index) => (
        <div key={index} className=''>
          {day}
        </div>
      ))}
    </>
  )
})

export default GridHeaders
