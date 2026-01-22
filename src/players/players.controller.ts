import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { LoginPlayerDto } from './dto/login-player.dto';
import { PlayerJwtAuthGuard } from './player-jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('player')
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const player = await this.playersService.validatePlayer(
      loginPlayerDto.email,
      loginPlayerDto.password,
    );
    if (!player) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.playersService.login(player);
  }

  @Public() // Bypasses global AppAuthGuard (which uses 'jwt' strategy) to allow PlayerJwtAuthGuard to handle auth
  @UseGuards(PlayerJwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const playerId = req.user.player_id;
    return this.playersService.findById(playerId);
  }
}
