import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubFilterDto } from './dto/club-filter.dto';
import { SchedulesService } from '../schedules/schedules.service';

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    private readonly schedulesService: SchedulesService,
  ) {}

  async create(createClubDto: CreateClubDto): Promise<Club> {
    const { schedules, ...clubData } = createClubDto;
    const createdClub = new this.clubModel(clubData);
    const savedClub = await createdClub.save();

    if (schedules && schedules.length > 0) {
      const schedulesWithClubId = schedules.map((s) => ({
        ...s,
        club_id: savedClub._id.toString(),
      }));
      await this.schedulesService.createMany(schedulesWithClubId);
    }

    return savedClub;
  }

  async findAll(): Promise<Club[]> {
    return this.clubModel.find().exec();
  }

  async findAllDetailed(
    filterDto: ClubFilterDto,
  ): Promise<{ data: Club[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, player_id } = filterDto;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (player_id) {
      query['player_id'] = player_id;
    }

    const [data, total] = await Promise.all([
      this.clubModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'schedules',
          populate: {
            path: 'court',
          },
        })
        .exec(),
      this.clubModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Club | null> {
    return this.clubModel.findById(id).exec();
  }

  async update(id: string, updateClubDto: UpdateClubDto): Promise<Club | null> {
    const updatedClub = await this.clubModel
      .findByIdAndUpdate(id, updateClubDto, { new: true })
      .exec();
    if (!updatedClub) {
      throw new NotFoundException(`Club #${id} not found`);
    }
    return updatedClub;
  }

  async remove(id: string): Promise<Club | null> {
    const deletedClub = await this.clubModel.findByIdAndDelete(id).exec();
    if (!deletedClub) {
      throw new NotFoundException(`Club #${id} not found`);
    }
    return deletedClub;
  }
}
