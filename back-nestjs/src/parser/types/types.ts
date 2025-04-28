/* eslint-disable prettier/prettier */
import { IsNumber, IsOptional, IsString } from 'class-validator'

export interface StudyPlanData {
	programm: string
	code: string
	profile: string
	department: string
	facultet: string
	qualification: string
	yearEnrollment: string
	stydyYear: string
	formEducation: string
	duration: string
}

export class ParserDto {
	@IsString()
	title: string

	@IsString()
	countWeeks: string

	@IsString()
	@IsOptional()
	groups: string

	@IsNumber()
	start_1: number

	@IsNumber()
	end_1: number

	@IsNumber()
	start_2: number

	@IsNumber()
	end_2: number

	@IsNumber()
	start_3: number

	@IsNumber()
	end_3: number

	@IsNumber()
	start_4: number

	@IsNumber()
	end_4: number
}

export class ParserSemestrsDto {
	@IsNumber()
	start_1: number

	@IsNumber()
	end_1: number

	@IsNumber()
	start_2: number

	@IsNumber()
	end_2: number

	@IsNumber()
	start_3: number

	@IsNumber()
	end_3: number

	@IsNumber()
	start_4: number

	@IsNumber()
	end_4: number
}
