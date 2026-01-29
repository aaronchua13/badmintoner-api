import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Court, CourtDocument } from './schemas/court.schema';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtsService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  async create(createCourtDto: CreateCourtDto): Promise<Court> {
    const createdCourt = new this.courtModel(createCourtDto);
    return createdCourt.save();
  }

  async findAll(): Promise<Court[]> {
    return this.courtModel.find().exec();
  }

  async findOne(id: string): Promise<Court | null> {
    return this.courtModel.findById(id).exec();
  }

  async update(
    id: string,
    updateCourtDto: UpdateCourtDto,
  ): Promise<Court | null> {
    const updatedCourt = await this.courtModel
      .findByIdAndUpdate(id, updateCourtDto, { new: true })
      .exec();
    if (!updatedCourt) {
      throw new NotFoundException(`Court #${id} not found`);
    }
    return updatedCourt;
  }

  async remove(id: string): Promise<Court | null> {
    const deletedCourt = await this.courtModel.findByIdAndDelete(id).exec();
    if (!deletedCourt) {
      throw new NotFoundException(`Court #${id} not found`);
    }
    return deletedCourt;
  }
}
