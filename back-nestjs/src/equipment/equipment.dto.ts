/* eslint-disable prettier/prettier */
import { IsString } from 'class-validator';

export class EquipmentDto {
  @IsString()
  title: string;
}
