import { Layout } from '@/components/layout/Layout'
import { ADMIN_PAGES } from '@/config/pages/admin.config'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { UserRole } from '@/services/auth/auth.types'
import { createBrowserRouter } from 'react-router-dom'
import { AdminPage } from './admin/Admin'
import { AudienceType } from './AudienceType/AudienceType'
import { LoginPage } from './auth/login/Login'
import RegisterPage from './auth/register/Register'
import { SocialAuthPage } from './auth/social-auth/SocialAuth'
import { Building } from './building/Building'
import BusyResourcePage from './BusyResourcePage/BusyResourcePage'
import { Constructor } from './constructor/Constructor'
import { CreateEquipment } from './createEquipment/createEquipment'
import { ManageAudiences } from './createRoom/ManageAudiences'
import { DashboardPage } from './dashboard/Dashboard'
import { Department } from './departments/Department'
import { DisciplineGroupAssignment } from './DisciplineGroupAssignment/DisciplineGroupAssignment'
import { Group } from './groups/Group'
import { HomePage } from './home/Home'
import { ManagerPage } from './manager/Manger'
import { PlansPage } from './plans/Plans'
import { Position } from './positions/Position'
import { UserProfile } from './profile/UserProfile'
import { ProtectedRoutes } from './ProtectedRoutes'
import { RedirectIfAuth } from './RedirectIfAuth'
import { SetPairsBetweenTeachers } from './SetPairsToTeacher/SetPairsToTeacher'
import TeacherDisciplineWish from './typeWishes/typeWishes'
import StudyPlanWizard from './upload/StudyPlanWizard'
import { UserPage } from './user/userPage'

export const router = createBrowserRouter([
	{
		element: <RedirectIfAuth />,
		children: [
			{
				path: PUBLIC_PAGES.LOGIN,
				element: <LoginPage />,
			},
			{
				path: PUBLIC_PAGES.REGISTER,
				element: <RegisterPage />,
			},
			{
				path: '/social-auth',
				element: <SocialAuthPage />,
			},
		],
	},
	{
		element: <ProtectedRoutes />,
		children: [
			{
				path: '/',
				element: <HomePage />,
			},

			{
				element: <Layout />,
				children: [
					{ path: PUBLIC_PAGES.DEPARTMENTS, element: <Department /> },
					{ path: PUBLIC_PAGES.POSITIONS, element: <Position /> },
					{ path: PUBLIC_PAGES.BUILDINGS, element: <Building /> },
					{ path: PUBLIC_PAGES.AUDIENCETYPES, element: <AudienceType /> },
					{ path: PUBLIC_PAGES.EQUIPMENTCREATE, element: <CreateEquipment /> },
					{ path: PUBLIC_PAGES.PLANS, element: <TeacherDisciplineWish /> },
					{ path: PUBLIC_PAGES.ROOMCREATE, element: <ManageAudiences /> },
					{ path: PUBLIC_PAGES.PARSER, element: <StudyPlanWizard /> },
					{ path: PUBLIC_PAGES.USERS, element: <UserPage /> },
					{ path: PUBLIC_PAGES.GROUPS, element: <Group /> },
					{ path: PUBLIC_PAGES.PROFILE, element: <UserProfile /> },
					{ path: PUBLIC_PAGES.CONSTRUCTOR, element: <Constructor /> },
					{
						path: PUBLIC_PAGES.SETPAIRSTOTEACHER,
						element: <SetPairsBetweenTeachers />,
					},
					{
						path: PUBLIC_PAGES.MERGEDISCIPLINES,
						element: <DisciplineGroupAssignment />,
					},
					{
						path: PUBLIC_PAGES.BUSYRESOURCE,
						element: <BusyResourcePage />,
					},
				],
			},
		],
	},
	{
		element: <ProtectedRoutes roles={UserRole.ADMIN} />,
		children: [
			{
				path: ADMIN_PAGES.HOME,
				element: <AdminPage />,
			},
		],
	},
	{
		element: <ProtectedRoutes roles={UserRole.MANAGER} />,
		children: [
			{
				path: '/manager',
				element: <ManagerPage />,
			},
		],
	},
	{
		element: <ProtectedRoutes roles={UserRole.PREMIUM} />,
		children: [
			{
				path: '/dashboard',
				element: <DashboardPage />,
			},
		],
	},
	{
		path: PUBLIC_PAGES.PLANS,
		element: <PlansPage />,
	},
	{
		path: '*',
		element: <div>404 not found!</div>,
	},
])
