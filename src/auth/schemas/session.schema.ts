import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({
  collection: 'user_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  access_token: string;

  @Prop({ default: true })
  is_active: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
