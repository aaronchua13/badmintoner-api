import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubFilterDto, TimeOfDay } from './dto/club-filter.dto';
import { SchedulesService } from '../schedules/schedules.service';
import { CourtsService } from '../courts/courts.service';

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    private readonly schedulesService: SchedulesService,
    private readonly courtsService: CourtsService,
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
    const {
      page = 1,
      limit = 10,
      player_id,
      court_location,
      day,
      time_of_day,
    } = filterDto;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (player_id) {
      query['player_id'] = player_id;
    }

    // Advanced Filtering (Court, Day, Time)
    // If any of these are present, we need to filter matching clubs via schedules/courts
    if (court_location || day || time_of_day) {
      let courtIds: string[] = [];

      // 1. Resolve Court IDs
      if (court_location) {
        // court_location can be comma-separated list of IDs or Search Terms
        const inputs = court_location.split(',').map((s) => s.trim());
        const mongoIds = inputs.filter((s) => /^[0-9a-fA-F]{24}$/.test(s));
        const searchTerms = inputs.filter((s) => !/^[0-9a-fA-F]{24}$/.test(s));

        if (mongoIds.length > 0) {
          courtIds = [...courtIds, ...mongoIds];
        }

        if (searchTerms.length > 0) {
          // Find IDs for each search term (OR logic)
          // Since courtsService.findIdsByTerm does regex OR on fields, we can just loop
          // But efficient way is to do one query.
          // For now, let's just map and flatten.
          const termIds = await Promise.all(
            searchTerms.map((term) => this.courtsService.findIdsByTerm(term)),
          );
          termIds.forEach((ids) => courtIds.push(...ids));
        }

        // If after checking inputs we have no IDs, and there were inputs, return empty
        if (courtIds.length === 0) {
          return { data: [], total: 0, page, limit };
        }
      }

      // 2. Resolve Days
      let days: string[] | undefined;
      if (day) {
        days = day.split(',').map((d) => d.trim());
      }

      // 3. Resolve Time Ranges
      let timeRanges: Array<{ start?: string; end?: string }> | undefined;
      if (time_of_day) {
        const times = time_of_day.split(',').map((t) => t.trim().toLowerCase());
        timeRanges = [];
        times.forEach((t) => {
          if (t === TimeOfDay.MORNING.toString()) {
            timeRanges!.push({ end: '12:00' });
          } else if (t === TimeOfDay.AFTERNOON.toString()) {
            timeRanges!.push({ start: '12:00', end: '18:00' });
          } else if (t === TimeOfDay.EVENING.toString()) {
            timeRanges!.push({ start: '18:00' });
          }
        });
      }

      // 4. Find Club IDs matching all schedule/court criteria
      const matchingClubIds = await this.schedulesService.findClubIdsByFilters({
        courtIds: courtIds.length > 0 ? courtIds : undefined,
        days,
        timeRanges,
      });

      if (matchingClubIds.length === 0) {
        return { data: [], total: 0, page, limit };
      }

      // 5. Add to main query
      query['_id'] = { $in: matchingClubIds };
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
    const { schedules, ...clubData } = updateClubDto;

    const updatedClub = await this.clubModel
      .findByIdAndUpdate(id, clubData, { new: true })
      .exec();

    if (!updatedClub) {
      throw new NotFoundException(`Club #${id} not found`);
    }

    if (schedules) {
      // 1. Get existing schedules for this club
      const existingSchedules = await this.schedulesService.findAllByClub(id);
      const existingIds = existingSchedules.map((s) => s._id.toString());

      // 2. Identify schedules to delete (exist in DB but not in request)
      const incomingIds = schedules.filter((s) => s.id).map((s) => s.id);

      const idsToDelete = existingIds.filter(
        (eid) => !incomingIds.includes(eid),
      );

      if (idsToDelete.length > 0) {
        await Promise.all(
          idsToDelete.map((tid) => this.schedulesService.remove(tid)),
        );
      }

      // 3. Update existing or Create new schedules
      await Promise.all(
        schedules.map((scheduleDto) => {
          if (scheduleDto.id) {
            // Update
            return this.schedulesService.update(scheduleDto.id, scheduleDto);
          } else {
            // Create
            return this.schedulesService.create({
              ...scheduleDto,
              club_id: id,
            });
          }
        }),
      );
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
