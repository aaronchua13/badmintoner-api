import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import {
  UserCredential,
  UserCredentialDocument,
} from './schemas/user-credential.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserCredential.name)
    private userCredentialModel: Model<UserCredentialDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;

    const existingUser = await this.findOneByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create User
    const createdUser = new this.userModel({
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.first_name}`,
      role: userData.role || 'user',
      preferences: {
        theme: 'light',
        notifications: true,
      },
    });
    const savedUser = await createdUser.save();

    // Create Credentials
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const credentials = new this.userCredentialModel({
      userId: savedUser._id,
      passwordHash,
    });
    await credentials.save();

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.email) {
      const existingUser = await this.findOneByEmail(updateUserDto.email);
      if (existingUser && existingUser._id.toString() !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    const updateData: any = { ...updateUserDto };
    if (updateUserDto.first_name) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.firstName = updateUserDto.first_name;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete updateData.first_name;
    }
    if (updateUserDto.last_name) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.lastName = updateUserDto.last_name;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete updateData.last_name;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(updateUserDto.password, salt);
      await this.userCredentialModel
        .findOneAndUpdate({ userId: id }, { passwordHash }, { upsert: true })
        .exec();
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userCredentialModel.findOneAndDelete({ userId: id }).exec();
    return deletedUser;
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findCredentialsByUserId(
    userId: Types.ObjectId,
  ): Promise<UserCredentialDocument | null> {
    return this.userCredentialModel.findOne({ userId }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}
