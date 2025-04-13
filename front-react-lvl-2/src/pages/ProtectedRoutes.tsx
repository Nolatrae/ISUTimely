import { PUBLIC_PAGES } from '@/config/pages/public.config'
import type { TUserDataState } from '@/hooks/transform-user-to-state'
import { useProfile } from '@/hooks/useProfile'
import { UserRole } from '@/services/auth/auth.types'
import { Navigate, Outlet } from 'react-router-dom'

type RoleCheckFunction = (user: TUserDataState) => boolean

const roleChecks: Partial<Record<UserRole, RoleCheckFunction>> = {
	[UserRole.ADMIN]: (user: TUserDataState) => user.isAdmin,
	[UserRole.PREMIUM]: (user: TUserDataState) => user.isPremium,
	[UserRole.MANAGER]: (user: TUserDataState) => user.isManager
}

type TRoles = UserRole[] | UserRole

export const ProtectedRoutes = ({
	roles = UserRole.USER
}: {
	roles?: TRoles
}) => {
	const { user, isLoading } = useProfile()

	if (isLoading) return <div>Loading...</div>

	const rolesArray = Array.isArray(roles) ? roles : [roles]

	const is404Redirect =
		rolesArray.includes(UserRole.ADMIN) || rolesArray.includes(UserRole.MANAGER)

	if (!user?.isLoggedIn)
		return (
			<Navigate
				to={is404Redirect ? '*' : PUBLIC_PAGES.LOGIN}
				replace
			/>
		)

	for (const role of rolesArray) {
		const checkRole = roleChecks[role]
		if (checkRole && !checkRole(user as TUserDataState)) {
			if (role === UserRole.PREMIUM) {
				return (
					<Navigate
						to={PUBLIC_PAGES.PLANS}
						replace
					/>
				)
			} else {
				return (
					<Navigate
						to={'*'}
						replace
					/>
				)
			}
		}
	}

	return <Outlet />
}
