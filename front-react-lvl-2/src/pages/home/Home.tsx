import { ProfileInfo } from './ProfileInfo'

export function HomePage() {
	return (
		<div>
			<h1 className="mt-4">Home Page</h1>
			<p>(only for loggedIn user)</p>
			<br />
			<p>Для проверки прав, есть страницы: /premium, /admin, /manager</p>

			<ProfileInfo />
		</div>
	)
}
