import { match } from 'path-to-regexp'
import { useLocation } from 'react-router-dom'
import type { ISidebarItem } from '../sidebar.types'
import { MenuItem } from './MenuItem'

interface Props {
	title ?: string,
	menu: ISidebarItem[]
	isShowedSidebar: boolean
}

export function SidebarMenu({menu, title, isShowedSidebar} : Props) {
	const location = useLocation()
	return (
		<nav>
			{title && <div className='opacity-70 uppercase font-medium text-xs mb-3'>{title}</div>}
			<ul>
			{menu.map(menuItem => {
					const props = {
						item: menuItem,
						isActive: !!match(menuItem.link)(location.pathname),
						isShowedSidebar
					}

					return (
						<MenuItem
							key={menuItem.label}
							{...props}
						/>
					)
				})}
			</ul>
		</nav>
	)
}