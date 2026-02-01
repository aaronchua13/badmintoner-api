import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule, ScheduleDocument } from './schemas/schedule.schema';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const createdSchedule = new this.scheduleModel(createScheduleDto);
    return createdSchedule.save();
  }

  async createMany(
    createScheduleDtos: CreateScheduleDto[],
  ): Promise<Schedule[]> {
    return this.scheduleModel.insertMany(createScheduleDtos);
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleModel.find().exec();
  }

  async findAllByClub(clubId: string): Promise<ScheduleDocument[]> {
    return this.scheduleModel.find({ club_id: clubId }).exec();
  }

  async findOne(id: string): Promise<Schedule | null> {
    return this.scheduleModel.findById(id).exec();
  }

  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule | null> {
    const updatedSchedule = await this.scheduleModel
      .findByIdAndUpdate(id, updateScheduleDto, { new: true })
      .exec();
    if (!updatedSchedule) {
      throw new NotFoundException(`Schedule #${id} not found`);
    }
    return updatedSchedule;
  }

  async remove(id: string): Promise<Schedule | null> {
    const deletedSchedule = await this.scheduleModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedSchedule) {
      throw new NotFoundException(`Schedule #${id} not found`);
    }
    return deletedSchedule;
  }

  async findClubIdsByFilters(filters: {
    courtIds?: string[];
    days?: string[];
    timeRanges?: Array<{ start?: string; end?: string }>;
  }): Promise<string[]> {
    const query: Record<string, any> = {};

    if (filters.courtIds && filters.courtIds.length > 0) {
      query.court_id = { $in: filters.courtIds };
    }

    if (filters.days && filters.days.length > 0) {
      // Create regex for each day and use $or, or just $in with exact values?
      // Since days are usually "Monday", "Tuesday", etc., strict match might be safer if normalized.
      // But user might send "mon", so regex is better.
      // However, $in with regex is not supported directly in all Mongo versions cleanly without $or.
      // Let's use $or with regexes.
      query.$or = filters.days.map((d) => ({
        day: { $regex: d, $options: 'i' },
      }));
    }

    if (filters.timeRanges && filters.timeRanges.length > 0) {
      const timeOrConditions = filters.timeRanges.map((range) => {
        const cond: Record<string, any> = {};
        if (range.start) cond['$gte'] = range.start;
        if (range.end) cond['$lt'] = range.end;
        return { start_time: cond };
      });

      if (query['$or']) {
        const existingOr = query['$or'] as Record<string, any>[];
        query['$and'] = [{ $or: existingOr }, { $or: timeOrConditions }];
        delete query['$or'];
      } else {
        query['$or'] = timeOrConditions;
      }
    }

    const schedules = await this.scheduleModel
      .find(query)
      .select('club_id')
      .exec();
    // Use Set to return unique IDs
    const clubIds = new Set(schedules.map((s) => s.club_id.toString()));
    return Array.from(clubIds);
  }
}
