import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OmitType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from '../../schedules/dto/create-schedule.dto';

export class CreateNestedScheduleDto extends OmitType(CreateScheduleDto, [
  'club_id',
] as const) {}

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  player_id?: string;

  @IsString()
  @IsNotEmpty()
  contact_person_name: string;

  @IsString()
  @IsOptional()
  fb_link?: string;

  @IsString()
  @IsOptional()
  established_date?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateNestedScheduleDto)
  schedules?: CreateNestedScheduleDto[];
}
