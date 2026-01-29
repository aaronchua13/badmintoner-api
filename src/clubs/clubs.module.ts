import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { Club, ClubSchema } from './schemas/club.schema';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Club.name, schema: ClubSchema }]),
    SchedulesModule,
  ],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
