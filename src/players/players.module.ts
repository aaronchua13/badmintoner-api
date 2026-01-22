import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { Player, PlayerSchema } from './schemas/player.schema';
import {
  PlayerCredential,
  PlayerCredentialSchema,
} from './schemas/player-credential.schema';
import {
  PlayerSession,
  PlayerSessionSchema,
} from './schemas/player-session.schema';
import { PlayerJwtStrategy } from './player-jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Player.name, schema: PlayerSchema },
      { name: PlayerCredential.name, schema: PlayerCredentialSchema },
      { name: PlayerSession.name, schema: PlayerSessionSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PlayersController],
  providers: [PlayersService, PlayerJwtStrategy],
  exports: [PlayersService],
})
export class PlayersModule {}
