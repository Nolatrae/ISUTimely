import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { Bell, LayoutGrid, PlusSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HeaderLinks() {
	return (
		<div className='flex items-center gap-1'>
			<Link
				to={PUBLIC_PAGES.HOME}
				className='transition-opacity hover:opacity-100 opacity-50 p-2'
				aria-label='Upload video'
			>
				<PlusSquare size={20} />
			</Link>
			<Link
				to={PUBLIC_PAGES.HOME}
				className='transition-opacity hover:opacity-100 opacity-50 p-2'
				aria-label='Studio page'
			>
				<LayoutGrid size={20} />
			</Link>
			<Link
				to={PUBLIC_PAGES.HOME}
				className='transition-opacity hover:opacity-100 opacity-50 p-2'
				aria-label='Notification'
			>
				<Bell size={20} />
			</Link>
		</div>
	)
}
