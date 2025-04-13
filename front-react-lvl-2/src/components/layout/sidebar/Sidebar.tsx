import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { useProfile } from '@/hooks/useProfile'
import authService from '@/services/auth/auth.service'
import { useMutation } from '@tanstack/react-query'
import cn from 'clsx'
import { LogOut } from 'lucide-react'
import { useTransition } from 'react'
import { SidebarHeader } from './header/SidebarHeader'
import { SidebarMenu } from './menus/SidebarMenu'
import { SIDEBAR_DATA } from './sidebar.data'

export function Sidebar({
	toggleSidebar,
	isShowedSidebar,
}: {
	toggleSidebar: () => void
	isShowedSidebar: boolean
}) {
	const [isPending, startTransition] = useTransition()

	const { mutate: mutateLogout, isPending: isLogoutPending } = useMutation({
		mutationKey: ['logout'],
		mutationFn: () => authService.logout(),
		onSuccess() {
			startTransition(() => {
				window.location.href = PUBLIC_PAGES.LOGIN
			})
		},
	})

	const isLogoutLoading = isLogoutPending || isPending
	const { user, isLoading } = useProfile()

	return (
		<aside className='p-layout border-r border-border whitespace-nowrap overflow-hidden'>
			<div>
				<SidebarHeader toggleSidebar={toggleSidebar} />
				<SidebarMenu menu={SIDEBAR_DATA} isShowedSidebar={isShowedSidebar} />
			</div>

			<div className='flex flex-col gap-2'>
				{/* Кнопка выхода */}
				<button
					onClick={() => mutateLogout()}
					disabled={isLogoutLoading}
					className={cn(
						'group py-3 flex items-center gap-5 w-full transition-colors',
						'text-white justify-start'
					)}
				>
					<LogOut
						className={cn('min-w-6 text-white', {
							'group-hover:text-primary transition group-hover:rotate-6':
								!isLogoutLoading,
						})}
					/>
					{isShowedSidebar && (
						<span className='border-b border-transparent group-hover:border-white text-base'>
							Выход
						</span>
					)}
				</button>
			</div>
		</aside>
	)
}
