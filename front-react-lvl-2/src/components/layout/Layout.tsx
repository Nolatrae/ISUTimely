import cn from 'clsx'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Content } from './content/Content'

import { Sidebar } from './sidebar/Sidebar'

import styles from './Layout.module.scss'

export function Layout() {
	const [isShowedSidebar, setIsShowedSidebar] = useState(false)

	const toggleSidebar = () => {
		setIsShowedSidebar(!isShowedSidebar)
	}

	return (
		<div className={cn(
			'flex min-h-screen w-full',
			styles.initialSidebar,
			isShowedSidebar ? styles.showedSidebar : styles.hidedSidebar
		)}>
			<Sidebar 
				toggleSidebar={toggleSidebar}
				isShowedSidebar={isShowedSidebar}
			/>
			<Content>
				<Outlet />
			</Content>
		</div>
	)
}
