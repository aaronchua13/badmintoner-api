import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ClubFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  player_id?: string;
}
