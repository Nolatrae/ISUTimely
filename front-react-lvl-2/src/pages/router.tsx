import { Layout } from '@/components/layout/Layout'
import { ADMIN_PAGES } from '@/config/pages/admin.config'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { UserRole } from '@/services/auth/auth.types'
import { createBrowserRouter } from 'react-router-dom'
import { AdminPage } from './admin/Admin'
import { AudienceType } from './AudienceType/AudienceType'
import { LoginPage } from './auth/login/Login'
import RegisterPage from './auth/register/Register'
import { Building } from './building/Building'
import BusyResourcePage from './BusyResourcePage/BusyResourcePage'
import { ZaoConstructor } from './Consrtuctor zao/Constructor'
import { Constructor } from './constructor/Constructor'
import { CreateEquipment } from './createEquipment/createEquipment'
import { ManageAudiences } from './createRoom/ManageAudiences'
import { Department } from './departments/Department'
import { DisciplineGroupAssignment } from './DisciplineGroupAssignment/DisciplineGroupAssignment'
import { Group } from './groups/Group'
import { Position } from './positions/Position'
import { UserProfile } from './profile/UserProfile'
import { ProtectedRoutes } from './ProtectedRoutes'
import { RedirectIfAuth } from './RedirectIfAuth'
import { SetPairsBetweenTeachers } from './SetPairsToTeacher/SetPairsToTeacher'
import TeacherDisciplineWish from './typeWishes/typeWishes'
import StudyPlanWizard from './upload/StudyPlanWizard'
import { UserPage } from './user/userPage'

export const router = createBrowserRouter([
	// Раздел для логина и регистрации
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
		],
	},
	// Раздел для защищённых маршрутов, оборачиваем все страницы в <Layout />
	{
		element: <ProtectedRoutes roles={[UserRole.TEACHER]} />, // Только для преподавателей
		children: [
			{
				element: <Layout />,
				children: [
					{ path: PUBLIC_PAGES.PROFILE, element: <UserProfile /> }, // Профиль для преподавателя
					{ path: PUBLIC_PAGES.PLANS, element: <TeacherDisciplineWish /> }, // Страница для преподавателя
				],
			},
		],
	},
	// Раздел для защищённых маршрутов для администраторов
	{
		element: <ProtectedRoutes roles={[UserRole.ADMIN]} />, // Только для администраторов
		children: [
			{
				element: <Layout />,
				children: [
					{ path: PUBLIC_PAGES.PROFILE_ADMIN, element: <UserProfile /> },
					{ path: ADMIN_PAGES.HOME, element: <AdminPage /> }, // Для администратора
					{ path: PUBLIC_PAGES.DEPARTMENTS, element: <Department /> }, // Для администратора
					{ path: PUBLIC_PAGES.POSITIONS, element: <Position /> }, // Для администратора
					{ path: PUBLIC_PAGES.BUILDINGS, element: <Building /> }, // Для администратора
					{ path: PUBLIC_PAGES.AUDIENCETYPES, element: <AudienceType /> }, // Для администратора
					{ path: PUBLIC_PAGES.EQUIPMENTCREATE, element: <CreateEquipment /> }, // Для администратора
					{ path: PUBLIC_PAGES.ROOMCREATE, element: <ManageAudiences /> }, // Для администратора
					{ path: PUBLIC_PAGES.PARSER, element: <StudyPlanWizard /> }, // Для администратора
					{ path: PUBLIC_PAGES.USERS, element: <UserPage /> }, // Для администратора
					{ path: PUBLIC_PAGES.GROUPS, element: <Group /> }, // Для администратора
					{ path: PUBLIC_PAGES.CONSTRUCTOR, element: <Constructor /> }, // Для администратора
					{
						path: PUBLIC_PAGES.SETPAIRSTOTEACHER,
						element: <SetPairsBetweenTeachers />,
					}, // Для администратора
					{
						path: PUBLIC_PAGES.MERGEDISCIPLINES,
						element: <DisciplineGroupAssignment />,
					}, // Для администратора
					{ path: PUBLIC_PAGES.BUSYRESOURCE, element: <BusyResourcePage /> }, // Для администратора
					{ path: PUBLIC_PAGES.ZAOCONSTRUCTOR, element: <ZaoConstructor /> }, // Для администратора
				],
			},
		],
	},
	// 404 Страница для всех остальных маршрутов
	{
		path: '*',
		element: <div>404 not found!</div>,
	},
])
