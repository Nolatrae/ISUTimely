/* eslint-disable prettier/prettier */
import { IsString } from 'class-validator';

export class BuildingDto {
  @IsString()
  title: string;
}
