import { HeaderLinks } from './HeaderLinks'
import { SearchField } from './SearchField'

export function Header() {
	return (
		<header className='p-layout border-b border-border flex items-center justify-between'>
			<div className='flex items-center gap-8'>
				<SearchField />
				<HeaderLinks />
			</div>
		</header>
	)
}
