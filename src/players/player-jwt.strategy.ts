import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PlayerSession,
  PlayerSessionDocument,
} from './schemas/player-session.schema';
import { Request } from 'express';

@Injectable()
export class PlayerJwtStrategy extends PassportStrategy(
  Strategy,
  'player-jwt',
) {
  constructor(
    configService: ConfigService,
    @InjectModel(PlayerSession.name)
    private playerSessionModel: Model<PlayerSessionDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Check if token is for player
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (payload.type !== 'player') {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const playerId: string = payload.sub;

    const session = await this.playerSessionModel
      .findOne({
        access_token: token,
        player_id: new Types.ObjectId(playerId),
      })
      .exec();

    if (!session) {
      const sessionByToken = await this.playerSessionModel
        .findOne({ access_token: token })
        .exec();
      if (sessionByToken) {
        throw new UnauthorizedException(
          `Session found but ID mismatch. Token ID: ${playerId}, Session ID: ${sessionByToken.player_id.toString()}`,
        );
      }
      throw new UnauthorizedException(
        `Session not found for token: ${token.substring(0, 10)}...`,
      );
    }

    if (!session.is_active) {
      throw new UnauthorizedException('Session is not active');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    return { player_id: playerId, email: payload.email };
  }
}
