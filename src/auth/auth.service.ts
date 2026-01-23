import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const credentials = await this.usersService.findCredentialsByUserId(
      user._id as unknown as Types.ObjectId,
    );

    if (!credentials) {
      throw new UnauthorizedException('User has no credentials');
    }

    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
    const credsObj = (credentials as any).toObject
      ? (credentials as any).toObject()
      : credentials;
    const hash = (credsObj.password_hash || credsObj.passwordHash) as string;
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */

    if (!hash) {
      throw new UnauthorizedException('User has no password set');
    }

    const isMatch = await bcrypt.compare(pass, hash);
    if (isMatch) {
      return user.toObject();
    }
    throw new UnauthorizedException('Invalid password');
  }

  async login(user: UserDocument) {
    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload);

    // Create and save session
    try {
      await this.sessionModel.create({
        user_id: user._id,
        access_token: accessToken,
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }

    return {
      access_token: accessToken,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }
    const user = await this.usersService.create(createUserDto);
    return this.login(user as UserDocument);
  }

  async getSession(accessToken: string) {
    const session = await this.sessionModel
      .findOne({ access_token: accessToken })
      .populate('user_id');
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }
    return session;
  }
}
