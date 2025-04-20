export interface ScheduledPair {
	id: string
	halfYear: string
	weekType: 'EVEN' | 'ODD'
	dayOfWeek: string // например, "MON"
	timeSlotId: string // например, "08:30-10:00"
	timeSlot: { title: string }
	assignment: {
		discipline: { id: string; name: string }
		teachers: {
			teacher: { id: string; user: { firstName: string; lastName: string } }
		}[]
	}
	groups: { group: { id: string; title: string } }[]
	rooms: { audience: { id: string; title: string } }[]
}
