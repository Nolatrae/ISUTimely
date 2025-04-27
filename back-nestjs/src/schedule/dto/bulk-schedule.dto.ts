import { IsNotEmpty, IsObject, IsString } from 'class-validator'

export class BulkScheduleDto {
	@IsString() @IsNotEmpty() studyPlanId: string
	@IsString() @IsNotEmpty() groupId: string
	@IsString() @IsNotEmpty() halfYear: string
	@IsObject() schedule: {
		even: Record<
			string,
			{
				disciplineName: string
				type: 'lecture' | 'practice' | 'lab'
				isOnline: boolean
				roomId?: string
				teacherIds?: string[]
			}
		>
		odd: Record<
			string,
			{
				disciplineName: string
				type: 'lecture' | 'practice' | 'lab'
				isOnline: boolean
				roomId?: string
				teacherIds?: string[]
			}
		>
	}
}

export class BulkScheduleDistanceDto {
	@IsString() @IsNotEmpty() studyPlanId: string
	@IsString() @IsNotEmpty() groupId: string
	@IsString() @IsNotEmpty() halfYear: string
	@IsObject() schedule: {
		week1: Record<
			string,
			{
				disciplineName: string
				type: 'lecture' | 'practice' | 'lab'
				isOnline: boolean
				roomId?: string
				teacherIds?: string[]
			}
		>
		week2: Record<
			string,
			{
				disciplineName: string
				type: 'lecture' | 'practice' | 'lab'
				isOnline: boolean
				roomId?: string
				teacherIds?: string[]
			}
		>
		week3: Record<
			string,
			{
				disciplineName: string
				type: 'lecture' | 'practice' | 'lab'
				isOnline: boolean
				roomId?: string
				teacherIds?: string[]
			}
		>
		week4: Record<
			string,
			{
				disciplineName: string
				type: 'lecture' | 'practice' | 'lab'
				isOnline: boolean
				roomId?: string
				teacherIds?: string[]
			}
		>
	}
}
