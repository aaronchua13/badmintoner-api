import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
}

export class ClubFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  player_id?: string;

  @IsOptional()
  @IsString()
  court_location?: string;

  @IsOptional()
  @IsString()
  day?: string;

  @IsOptional()
  @IsString()
  time_of_day?: string;
}
