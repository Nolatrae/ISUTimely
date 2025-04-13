import { create } from 'zustand'

/**
 * В этом интерфейсе мы храним агрегированную информацию:
 * totalPairs – всего пар по данному типу занятия (офлайн + онлайн),
 * onlinePossible – сколько из них МОЖНО провести онлайн (необязательно столько и провести).
 */
export interface IDisciplineEntry {
	id: string
	disciplineName: string
	type: string
	totalPairs: number
	onlinePossible: number
}

interface PairState {
	disciplines: IDisciplineEntry[]
	selectedDiscipline: IDisciplineEntry | null

	setDisciplines: (items: IDisciplineEntry[]) => void
	toggleDiscipline: (item: IDisciplineEntry) => void

	/**
	 * Сокращаем общее число пар на 1.
	 * Если isOnline = true – дополнительно сокращаем onlinePossible (если там ещё > 0).
	 */
	decrementPair: (id: string, isOnline: boolean) => void

	/**
	 * Обратная операция: возвращаем пару в «свободные»,
	 * увеличиваем totalPairs, а при isOnline – ещё и onlinePossible
	 */
	incrementPair: (id: string, isOnline: boolean) => void

	clearSelectedDiscipline: () => void
}

export const useSelectedPairStore = create<PairState>((set, get) => ({
	disciplines: [],
	selectedDiscipline: null,

	setDisciplines: items => set({ disciplines: items }),

	toggleDiscipline: item => {
		const current = get().selectedDiscipline
		if (current && current.id === item.id) {
			set({ selectedDiscipline: null })
		} else {
			set({ selectedDiscipline: item })
		}
	},

	decrementPair: (id, isOnline) => {
		set(state => {
			const newDisciplines = state.disciplines.map(d => {
				if (d.id === id && d.totalPairs > 0) {
					let totalPairs = d.totalPairs - 1
					let onlinePossible = d.onlinePossible
					if (isOnline && d.onlinePossible > 0) {
						onlinePossible = d.onlinePossible - 1
					}
					return { ...d, totalPairs, onlinePossible }
				}
				return d
			})
			return { disciplines: newDisciplines }
		})
	},

	incrementPair: (id, isOnline) => {
		set(state => {
			const newDisciplines = state.disciplines.map(d => {
				if (d.id === id) {
					let totalPairs = d.totalPairs + 1
					let onlinePossible = d.onlinePossible
					if (isOnline) {
						onlinePossible = d.onlinePossible + 1
					}
					return { ...d, totalPairs, onlinePossible }
				}
				return d
			})
			return { disciplines: newDisciplines }
		})
	},

	clearSelectedDiscipline: () => set({ selectedDiscipline: null }),
}))
