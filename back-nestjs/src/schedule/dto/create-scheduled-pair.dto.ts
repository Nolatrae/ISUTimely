import { WeekType } from '.prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateScheduledPairDto {
	@IsString() @IsNotEmpty() groupId: string
	@IsString() @IsNotEmpty() studyPlanId: string
	@IsString() @IsNotEmpty() halfYear: string
	@IsEnum(WeekType) weekType: WeekType
	@IsString() @IsNotEmpty() dayOfWeek: string
	@IsString() @IsNotEmpty() timeSlotId: string
	@IsString() @IsNotEmpty() discipline: string
	@IsString() @IsNotEmpty() type: 'lecture' | 'practice' | 'lab'
	@IsOptional() isOnline?: boolean
	@IsOptional() roomId?: string
	@IsOptional() teacherIds?: string[]
}
