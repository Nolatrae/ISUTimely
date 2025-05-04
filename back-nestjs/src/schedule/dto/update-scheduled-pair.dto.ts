import { IsOptional, IsString } from 'class-validator'

export class UpdateScheduledPairDto {
	@IsOptional() @IsString() discipline?: string
	@IsOptional() @IsString() type?: 'lecture' | 'practice' | 'lab'
	@IsOptional() isOnline?: boolean
	@IsOptional() @IsString() roomId?: string
	@IsOptional() teacherIds?: string[]
	@IsOptional() @IsString() groupId?: string
}
