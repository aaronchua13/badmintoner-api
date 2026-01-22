import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PlayerJwtAuthGuard extends AuthGuard('player-jwt') {}
