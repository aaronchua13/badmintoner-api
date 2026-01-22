import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { LoginPlayerDto } from './dto/login-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerJwtAuthGuard } from './player-jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller(['players', 'player'])
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Public()
  @Post('signup')
  signup(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginPlayerDto: LoginPlayerDto) {
    const player = await this.playersService.validatePlayer(
      loginPlayerDto.email,
      loginPlayerDto.password,
    );
    if (!player) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.playersService.login(player);
  }

  @Public()
  @UseGuards(PlayerJwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const playerId = req.user.player_id as string;
    return this.playersService.findById(playerId);
  }

  @Public()
  @UseGuards(PlayerJwtAuthGuard)
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() updatePlayerDto: UpdatePlayerDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const playerId = req.user.player_id as string;
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
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.update(id, updatePlayerDto);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }
}
