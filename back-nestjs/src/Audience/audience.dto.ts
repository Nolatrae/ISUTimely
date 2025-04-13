/* eslint-disable prettier/prettier */
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AudienceDto {
  @IsString()
  title: string;

  @IsString()
  audienceTypeId: string; // ID типа аудитории

  @IsString()
  buildingId: string; // ID здания

  @IsInt()
  @Min(1)
  @Max(500)
  capacity: number;

  @IsOptional()
  @IsString()
  additionalInfo?: string;

  // Поле для оборудования
  @IsOptional()
  @IsArray()
  @ArrayUnique() // Убирает дублирующиеся ID
  @IsString({ each: true }) // Указывает, что каждый элемент массива должен быть строкой
  equipmentIds?: string[];
}

export class UpdateAudienceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  audienceTypeId?: string; // ID типа аудитории

  @IsOptional()
  @IsString()
  buildingId?: string; // ID здания

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  capacity?: number;

  @IsOptional()
  @IsString()
  additionalInfo?: string;

  // Поле для оборудования
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  equipmentIds?: string[];
}
