import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Player, PlayerDocument } from './schemas/player.schema';
import {
  PlayerCredential,
  PlayerCredentialDocument,
} from './schemas/player-credential.schema';
import {
  PlayerSession,
  PlayerSessionDocument,
} from './schemas/player-session.schema';
import { CreatePlayerDto } from './dto/create-player.dto';
import { LoginPlayerDto } from './dto/login-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
    @InjectModel(PlayerCredential.name)
    private playerCredentialModel: Model<PlayerCredentialDocument>,
    @InjectModel(PlayerSession.name)
    private playerSessionModel: Model<PlayerSessionDocument>,
    private jwtService: JwtService,
  ) {}

  async create(createPlayerDto: CreatePlayerDto) {
    const existingPlayer = await this.findOneByEmail(createPlayerDto.email);
    if (existingPlayer) {
      throw new ConflictException('Email already exists');
    }

    const { password, ...playerData } = createPlayerDto;

    // Create Player
    const createdPlayer = new this.playerModel({
      email: playerData.email,
      first_name: playerData.first_name,
      last_name: playerData.last_name,
    });
    const savedPlayer = await createdPlayer.save();

    // Create Credentials
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const credentials = new this.playerCredentialModel({
      player_id: savedPlayer._id,
      password_hash: passwordHash,
    });
    await credentials.save();

    // Auto login after signup
    return this.login(savedPlayer);
  }

  async validatePlayer(email: string, pass: string): Promise<any> {
    const player = await this.findOneByEmail(email);
    if (!player) {
      throw new UnauthorizedException('Player not found');
    }

    const credentials = await this.playerCredentialModel
      .findOne({ player_id: player._id })
      .lean()
      .exec();

    if (!credentials) {
      throw new UnauthorizedException('Player has no credentials');
    }

    const isMatch = await bcrypt.compare(pass, credentials.password_hash);
    if (isMatch) {
      return player.toObject();
    }
    throw new UnauthorizedException('Invalid password');
  }

  async login(player: PlayerDocument | any) {
    const payload = { email: player.email, sub: player._id, type: 'player' };
    const accessToken = this.jwtService.sign(payload);

    // Create and save session
    await this.playerSessionModel.create({
      player_id: player._id,
      access_token: accessToken,
    });

    return {
      access_token: accessToken,
    };
  }

  async getSession(accessToken: string) {
    const session = await this.playerSessionModel
      .findOne({ access_token: accessToken })
      .populate('player_id');
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }
    return session;
  }

  async findOneByEmail(email: string): Promise<PlayerDocument | null> {
    return this.playerModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<PlayerDocument | null> {
    return this.playerModel.findById(id).lean().exec() as Promise<PlayerDocument | null>;
  }
}
