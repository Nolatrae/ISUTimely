/* eslint-disable prettier/prettier */
import { IsString } from 'class-validator';

export class AudienceTypeDto {
  @IsString()
  title: string;
}
