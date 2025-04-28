import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { useProfile } from '@/hooks/useProfile'
import { UserRole } from '@/services/auth/auth.types'
import { Navigate, Outlet } from 'react-router-dom'

export const ProtectedRoutes = ({
	roles = [UserRole.ADMIN, UserRole.TEACHER],
}: {
	roles?: UserRole[] // Обновлено на массив с двумя ролями
}) => {
	const { user, isLoading } = useProfile()

	if (isLoading) return <div>Loading...</div>

	console.log(user.rights[0])
	const hasValidRole = roles.includes(user?.rights[0])

	// Если пользователь не авторизован, перенаправляем его в зависимости от роли
	if (!user?.isLoggedIn) {
		return (
			<Navigate
				to={roles.includes(UserRole.ADMIN) ? '*' : PUBLIC_PAGES.LOGIN} // Если роль ADMIN, редирект на 404
				replace
			/>
		)
	}

	// Если у пользователя нет подходящей роли, перенаправляем на 404
	if (!hasValidRole) {
		return <Navigate to={'*'} replace />
	}

	// Если роль подходит, выводим дочерние маршруты
	return <Outlet />
}
