import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { COLORS } from '@/constants/colors.constants'
import { CalendarSync, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SidebarHeader({ toggleSidebar }: { toggleSidebar: () => void }) {
	return (
		<div className='flex items-center gap-6 mb-12'>
			<button className='opacity-85 hover:opacity-100 transition-opacity' onClick={toggleSidebar} title='Toggle sidebar'>
				<Menu />
			</button>

			<Link to={PUBLIC_PAGES.PLANS} className='flex items-center gap-1'>
				<CalendarSync size={29} color={COLORS.primary} />
				<span className='font-medium text-xl'>Timely</span>
			</Link>	
		</div>
	)
}