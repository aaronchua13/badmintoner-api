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
}
