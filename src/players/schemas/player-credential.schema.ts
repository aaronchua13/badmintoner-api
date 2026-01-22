import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlayerCredentialDocument = PlayerCredential & Document;

@Schema({
  collection: 'player_credentials',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PlayerCredential {
  @Prop({ type: Types.ObjectId, ref: 'Player', required: true, unique: true })
  player_id: Types.ObjectId;

  @Prop({ required: true })
  password_hash: string;
}

export const PlayerCredentialSchema = SchemaFactory.createForClass(PlayerCredential);
