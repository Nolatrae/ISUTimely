import { useProfile } from '@/hooks/useProfile'

export function ProfileInfo() {
	const { user, isLoading } = useProfile()

	if (isLoading) return <div className='mt-10'>Загружаю профиль...</div>

	return (
		<div className='mt-10'>
			<h2 className='text-2xl font-bold'>Привет, {user.name || 'Аноним'}</h2>

			<br />
			<p>Права: {user.rights?.join(', ')}</p>
			<br />
		</div>
	)
}
