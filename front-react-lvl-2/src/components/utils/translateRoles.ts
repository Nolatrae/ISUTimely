export function translateRoles(roles: string): string {
	const translations: Record<string, string> = {
		ADMIN: 'Администратор',
		TEACHER: 'Преподаватель',
		USER: 'Пользователь',
	}

	return roles
		.split(',')
		.map(role => {
			const trimmed = role.trim()
			return translations[trimmed] || trimmed
		})
		.join(', ')
}
