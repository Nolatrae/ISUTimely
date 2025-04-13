import { create } from 'zustand'

export interface IPair {
	id: string
	disciplineName: string
	type: string
	pairNumber: number
}

interface PairState {
	pairs: IPair[] // весь список ещё не распределённых пар
	selectedPair: IPair | null // текущая выделенная (кликнутая) пара из панели 1

	setPairs: (pairs: IPair[]) => void // инициализировать/обновить pairs
	togglePair: (pair: IPair) => void // клик по паре: выделить / снять выделение
	removePair: (pair: IPair) => void // удалить пару из списка (после вставки в расписание)
	clearSelectedPair: () => void // сбросить selectedPair
	addPair: (pair: IPair) => void
}

export const useSelectedPairStore = create<PairState>((set, get) => ({
	pairs: [],
	selectedPair: null,

	setPairs: pairs => set({ pairs }),

	// togglePair: pair => {
	// 	const current = get().selectedPair
	// 	if (current && current.id === pair.id) {
	// 		set({ selectedPair: null })
	// 	} else {
	// 		set({ selectedPair: pair })
	// 	}
	// },

	togglePair: pair => {
		const current = get().selectedPair
		if (current && current.id === pair.id) {
			set({ selectedPair: null })
		} else {
			set({ selectedPair: pair })
		}
	},

	removePair: pair => {
		const oldPairs = get().pairs
		const newPairs = oldPairs.filter(p => p.id !== pair.id)
		set({ pairs: newPairs, selectedPair: null })
	},

	clearSelectedPair: () => set({ selectedPair: null }),

	addPair: pair => {
		const currentPairs = get().pairs
		set({ pairs: [...currentPairs, pair] })
	},
}))
