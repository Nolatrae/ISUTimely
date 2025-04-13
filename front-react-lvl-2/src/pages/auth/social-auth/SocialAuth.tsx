import { saveTokenStorage } from '@/services/auth/auth.helper'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function SocialAuthPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()

	useEffect(() => {
		const accessToken = searchParams.get('accessToken')
		if (accessToken) saveTokenStorage(accessToken)

		navigate('/', { replace: true })
	}, [navigate, searchParams])

	return <div>Loading...</div>
}
