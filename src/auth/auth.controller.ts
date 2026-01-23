import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  Get,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { PlayersService } from '../players/players.service';
import { CreatePlayerDto } from '../players/dto/create-player.dto';
import { LoginPlayerDto } from '../players/dto/login-player.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private playersService: PlayersService,
  ) {}

  // --- Admin Routes ---

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('admin/login')
  adminLogin(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.authService.login(req.user as UserDocument);
  }

  @Public()
  @Post('admin/signup')
  adminSignup(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  // --- Player Routes ---

  @Public()
  @Post('player/login')
  async playerLogin(@Body() loginPlayerDto: LoginPlayerDto) {
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
  @Post('player/signup')
  playerSignup(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  // --- Other Routes ---

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const userId = req.user.user_id;

      this.logger.log(`Fetching profile for user: ${userId}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const user = await this.usersService.findById(userId);
      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new InternalServerErrorException('User not found');
      }
      return user;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error in getProfile: ${err.message}`, err.stack);
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get('user-session')
  async getUserSession(@Request() req: any) {
    // Extract token from Authorization header
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const authHeader: string = req.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.getSession(token);
  }
}
