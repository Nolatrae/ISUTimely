import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useSelectedPairStore = create(
	devtools((set, get) => ({
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
				// Если обновляемая дисциплина является выбранной, обновляем и selectedDiscipline
				const updatedSelected =
					state.selectedDiscipline && state.selectedDiscipline.id === id
						? newDisciplines.find(d => d.id === id)
						: state.selectedDiscipline
				return {
					disciplines: newDisciplines,
					selectedDiscipline: updatedSelected,
				}
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
				// Если обновляемая дисциплина является выбранной, обновляем и selectedDiscipline
				const updatedSelected =
					state.selectedDiscipline && state.selectedDiscipline.id === id
						? newDisciplines.find(d => d.id === id)
						: state.selectedDiscipline
				return {
					disciplines: newDisciplines,
					selectedDiscipline: updatedSelected,
				}
			})
		},

		clearSelectedDiscipline: () => set({ selectedDiscipline: null }),
	}))
)
