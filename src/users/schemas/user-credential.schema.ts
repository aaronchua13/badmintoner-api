import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserCredentialDocument = HydratedDocument<UserCredential>;

@Schema({ collection: 'user_credentials' })
export class UserCredential {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  password_hash: string;
}

export const UserCredentialSchema = SchemaFactory.createForClass(UserCredential);
