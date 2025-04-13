/* eslint-disable prettier/prettier */
import { IsObject, IsOptional, IsString } from 'class-validator';

class Wish {
  @IsOptional()
  @IsString()
  discipline?: string;

  @IsOptional()
  @IsString()
  room?: string;
}

class Wishes {
  @IsObject()
  even: Record<string, Wish>;

  @IsObject()
  odd: Record<string, Wish>;
}

export class wishesDto {
  @IsObject()
  wishes: Wishes;

  @IsOptional()
  @IsString()
  notes?: string;
}
