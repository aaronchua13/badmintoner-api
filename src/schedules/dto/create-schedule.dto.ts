import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsMongoId,
} from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  day: string;

  @IsString()
  @IsNotEmpty()
  start_time: string;

  @IsString()
  @IsNotEmpty()
  end_time: string;

  @IsMongoId()
  @IsNotEmpty()
  court_id: string;

  @IsMongoId()
  @IsNotEmpty()
  club_id: string;

  @IsBoolean()
  @IsOptional()
  is_active: boolean;
}
