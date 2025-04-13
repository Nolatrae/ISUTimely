import UserService from '@/services/user.service'
import { useQuery } from '@tanstack/react-query'

export function PremiumContent() {
	const { data, isLoading } = useQuery({
		queryKey: ['premium-content'],
		queryFn: () => UserService.fetchPremium()
	})

	return (
		<div>
			<h1>Only for premium users</h1>
			{isLoading ? (
				<div>Loading...</div>
			) : (
				<p>{data?.data.text || 'Not found!'}</p>
			)}
		</div>
	)
}
