import { devtools } from 'zustand/middleware'

/**
 * Хелпер для подключения Zustand Devtools.
 * Использует devtools только в режиме разработки.
 */
export const withDevtools = <T extends object>(
	initializer: Parameters<typeof devtools<T>>[0],
	storeName?: string
) => {
	if (process.env.NODE_ENV === 'development') {
		return devtools(initializer, { name: storeName })
	}

	return initializer
}
