import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlayerSessionDocument = PlayerSession & Document;

@Schema({
  collection: 'player_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PlayerSession {
  @Prop({ type: Types.ObjectId, ref: 'Player', required: true })
  player_id: Types.ObjectId;

  @Prop({ required: true })
  access_token: string;

  @Prop({ default: true })
  is_active: boolean;
}

export const PlayerSessionSchema = SchemaFactory.createForClass(PlayerSession);
