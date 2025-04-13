import { create } from 'zustand'

export interface PairGroup {
	id: string
	disciplineName: string
	type: string
	total: number
	remaining: number
	canBeOnline: number
	onlineUsed: number
}

interface Store {
	groups: PairGroup[]
	selectedGroupId: string | null

	setGroups: (groups: PairGroup[]) => void
	selectGroup: (id: string) => void
	clearSelection: () => void

	usePair: (id: string, mode: 'offline' | 'online') => void
	releasePair: (id: string, mode: 'offline' | 'online') => void
}

export const usePairGroupsStore = create<Store>((set, get) => ({
	groups: [],
	selectedGroupId: null,

	setGroups: groups => set({ groups }),
	selectGroup: id =>
		set({ selectedGroupId: get().selectedGroupId === id ? null : id }),
	clearSelection: () => set({ selectedGroupId: null }),

	// usePair: (id, mode) => {
	// 	const groups = get().groups.map(group => {
	// 		if (group.id !== id) return group
	// 		if (group.remaining <= 0) return group

	// 		return {
	// 			...group,
	// 			remaining: group.remaining - 1,
	// 			onlineUsed: mode === 'online' ? group.onlineUsed + 1 : group.onlineUsed,
	// 		}
	// 	})
	// 	set({ groups })
	// },

	usePair: (id: string, mode: 'offline' | 'online') => {
		const groups = get().groups.map(group => {
			if (group.id !== id) return group
			if (group.remaining <= 0) return group

			return {
				...group,
				remaining: group.remaining - 1,
				onlineUsed: mode === 'online' ? group.onlineUsed + 1 : group.onlineUsed,
			}
		})
		set({ groups })
	},

	releasePair: (id, mode) => {
		const groups = get().groups.map(group => {
			if (group.id !== id) return group

			return {
				...group,
				remaining: group.remaining + 1,
				onlineUsed: mode === 'online' ? group.onlineUsed - 1 : group.onlineUsed,
			}
		})
		set({ groups })
	},
}))
