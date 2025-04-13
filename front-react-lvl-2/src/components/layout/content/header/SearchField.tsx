import { type KeyboardEvent, useState } from 'react'

interface Props {}

export function SearchField({}: Props) {
	const [searchTerm, setSearchTerm] = useState('')

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== 'Enter') return
		e.preventDefault()
		if (searchTerm.trim() !== '') {
			// router.push(PAGE.SEARCH(searchTerm))
		}
	}

	return (
		<div className='w-3/12'>
			<input
				type='search'
				placeholder='Type to search'
				className='py-2 px-4 w-full bg-transparent outline-none border-none shadow-none'
				value={searchTerm}
				onChange={e => setSearchTerm(e.target.value)}
				onKeyDown={handleKeyDown}
			/>
		</div>
	)
}
