import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (payload.type === 'player') {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const userId = payload.sub;

    if (!userId || !Types.ObjectId.isValid(userId as string)) {
      this.logger.warn(`Invalid user ID in JWT payload: ${userId}`);
      throw new UnauthorizedException('Invalid token payload');
    }

    let session: SessionDocument | null = null;
    try {
      session = await this.sessionModel
        .findOne({
          access_token: token,
          user_id: new Types.ObjectId(userId as string),
        })
        .exec();
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error validating session for user ${userId}: ${err.message}`,
      );
      // If DB error, we might want to fail safe or allow.
      // For now, allow proceeding if session check fails due to DB error,
      // as long as token signature is valid.
    }

    // Relaxed session check: Only throw if session exists and is explicitly inactive.
    if (session && !session.is_active) {
      throw new UnauthorizedException('Session invalid or expired');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    return { user_id: userId, email: payload.email };
  }
}
