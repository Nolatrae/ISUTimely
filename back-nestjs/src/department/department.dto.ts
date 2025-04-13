/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString } from 'class-validator';

export class DepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Название кафедры не может быть пустым' })
  title: string;
}
