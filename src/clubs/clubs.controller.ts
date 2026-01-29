import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubFilterDto } from './dto/club-filter.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Public()
  @Post()
  create(@Body() createClubDto: CreateClubDto) {
    return this.clubsService.create(createClubDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.clubsService.findAll();
  }

  @Public()
  @Get('detailed-list')
  findAllDetailed(@Query() filterDto: ClubFilterDto) {
    return this.clubsService.findAllDetailed(filterDto);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const club = await this.clubsService.findOne(id);
    if (!club) {
      throw new NotFoundException('Club not found');
    }
    return club;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto) {
    return this.clubsService.update(id, updateClubDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clubsService.remove(id);
  }
}
