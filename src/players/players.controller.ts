import {
  Controller,
  Body,
  Get,
  Patch,
  Delete,
  UseGuards,
  Request,
  Param,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlayersService } from './players.service';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Public()
  @UseGuards(AuthGuard(['jwt', 'player-jwt']))
  @Get('profile')
  getProfile(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const playerId = req.user.player_id as string;
    if (!playerId) {
      throw new ForbiddenException('Only players have profiles');
    }
    return this.playersService.findById(playerId);
  }

  @Public()
  @UseGuards(AuthGuard(['jwt', 'player-jwt']))
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() updatePlayerDto: UpdatePlayerDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const playerId = req.user.player_id as string;
    if (!playerId) {
      throw new ForbiddenException('Only players have profiles');
    }
    return this.playersService.update(playerId, updatePlayerDto);
  }

  @Public()
  @Get('profile/:idOrUsername')
  async getPublicProfile(@Param('idOrUsername') idOrUsername: string) {
    const player = await this.playersService.findByIdOrUsername(idOrUsername);
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  @Public()
  @UseGuards(AuthGuard(['jwt', 'player-jwt']))
  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const player = await this.playersService.findById(id);
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  @Public()
  @UseGuards(AuthGuard(['jwt', 'player-jwt']))
  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updatePlayerDto: UpdatePlayerDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user = req.user;

    // Allow if user is admin (has user_id) or if user is the player being updated
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.player_id && user.player_id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.playersService.update(id, updatePlayerDto);
  }

  @Public()
  @UseGuards(AuthGuard(['jwt', 'player-jwt']))
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user = req.user;

    // Allow if user is admin (has user_id) or if user is the player being deleted
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.player_id && user.player_id !== id) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    return this.playersService.remove(id);
  }
}
