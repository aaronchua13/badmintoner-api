import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
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
import { UpdatePlayerDto } from './dto/update-player.dto';

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
    try {
      const existingPlayer = await this.findOneByEmail(createPlayerDto.email);
      if (existingPlayer) {
        throw new ConflictException('Email already exists');
      }

      // Username logic
      let username = createPlayerDto.username;
      if (!username) {
        username = createPlayerDto.email.split('@')[0];
      }

      // Ensure unique username
      let uniqueUsername = username;
      let counter = 1;
      while (await this.findOneByUsername(uniqueUsername)) {
        uniqueUsername = `${username}${counter}`;
        counter++;
      }
      username = uniqueUsername;

      const { password, ...playerData } = createPlayerDto;

      // Create Player
      const createdPlayer = new this.playerModel({
        email: playerData.email,
        username: username,
        first_name: playerData.first_name,
        last_name: playerData.last_name,
        bio: playerData.bio,
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
      return await this.login(savedPlayer);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error('Error creating player:', error);
      const err = error as Error;
      throw new InternalServerErrorException(
        `Failed to create player: ${err.message}`,
      );
    }
  }

  async validatePlayer(
    email: string,
    pass: string,
  ): Promise<PlayerDocument | null> {
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
      return player;
    }
    throw new UnauthorizedException('Invalid password');
  }

  async login(player: PlayerDocument) {
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

  async findOneByUsername(username: string): Promise<PlayerDocument | null> {
    return this.playerModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<PlayerDocument | null> {
    return this.playerModel
      .findById(id)
      .lean()
      .exec() as Promise<PlayerDocument | null>;
  }

  async findByIdOrUsername(
    idOrUsername: string,
  ): Promise<PlayerDocument | null> {
    if (Types.ObjectId.isValid(idOrUsername)) {
      const player = await this.findById(idOrUsername);
      if (player) return player;
    }
    return this.findOneByUsername(idOrUsername);
  }

  async findAll(): Promise<PlayerDocument[]> {
    return this.playerModel.find().exec();
  }

  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    const { password, ...playerData } = updatePlayerDto;

    // Update Player Profile
    if (Object.keys(playerData).length > 0) {
      // If email is being changed, check if it exists
      if (playerData.email) {
        const existingPlayer = await this.findOneByEmail(playerData.email);
        if (existingPlayer && existingPlayer._id.toString() !== id) {
          throw new ConflictException('Email already exists');
        }
      }

      // If username is being changed, check if it exists
      if (playerData.username) {
        const existingPlayer = await this.findOneByUsername(
          playerData.username,
        );
        if (existingPlayer && existingPlayer._id.toString() !== id) {
          throw new ConflictException('Username already taken');
        }
      }

      await this.playerModel.findByIdAndUpdate(id, playerData).exec();
    }

    // Update Password
    if (password) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);

      await this.playerCredentialModel
        .findOneAndUpdate(
          { player_id: new Types.ObjectId(id) },
          { password_hash: passwordHash },
          { upsert: true },
        )
        .exec();
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<PlayerDocument | null> {
    // Delete credentials first
    await this.playerCredentialModel
      .findOneAndDelete({ player_id: new Types.ObjectId(id) })
      .exec();

    // Delete sessions
    await this.playerSessionModel
      .deleteMany({ player_id: new Types.ObjectId(id) })
      .exec();

    return this.playerModel.findByIdAndDelete(id).exec();
  }
}
