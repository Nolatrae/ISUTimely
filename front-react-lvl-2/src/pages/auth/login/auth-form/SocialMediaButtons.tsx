import { getServerUrl } from '@/config/get-server-url'

export function SocialMediaButtons() {
	return (
		<div className="grid grid-cols-2 gap-4">
			<button
				onClick={() => (window.location.href = getServerUrl('/auth/google'))}
				className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
				type="button"
			>
				<img
					src="/google.svg"
					width={20}
					height={20}
					alt="google auth"
					className="w-5 h-5 mr-2"
				/>
			</button>
			<button
				onClick={() => (window.location.href = getServerUrl('/auth/github'))}
				className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
				type="button"
			>
				<img
					src="/github.svg"
					width={20}
					height={20}
					alt="github auth"
					className="w-5 h-5 mr-2"
				/>
			</button>
		</div>
	)
}
