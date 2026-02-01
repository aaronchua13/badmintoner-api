import { PartialType } from '@nestjs/mapped-types';
import { CreateClubDto, CreateNestedScheduleDto } from './create-club.dto';
import { IsArray, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNestedScheduleDto extends CreateNestedScheduleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  _id?: string;

  @IsOptional()
  @IsString()
  club_id?: string;

  @IsOptional()
  created_at?: string;

  @IsOptional()
  updated_at?: string;

  @IsOptional()
  court?: any;

  @IsOptional()
  __v?: number;
}

export class UpdateClubDto extends PartialType(CreateClubDto) {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  _id?: string;

  @IsOptional()
  created_at?: string;

  @IsOptional()
  updated_at?: string;

  @IsOptional()
  __v?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateNestedScheduleDto)
  schedules?: UpdateNestedScheduleDto[];
}
