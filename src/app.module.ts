import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { CourtsModule } from './courts/courts.module';
import { ClubsModule } from './clubs/clubs.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AppAuthGuard } from './common/guards/app-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        console.log('Connecting to MongoDB URI:', uri);
        return {
          uri,
          dbName: 'badmintoner_db',
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    PlayersModule,
    CourtsModule,
    ClubsModule,
    SchedulesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
