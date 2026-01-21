import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserCredentialDocument = HydratedDocument<UserCredential>;

@Schema({ collection: 'user_credentials' })
export class UserCredential {
  @Prop({ type: Types.ObjectId, ref: 'User', name: 'user_id', required: true })
  userId: Types.ObjectId;

  @Prop({ name: 'password_hash', required: true })
  passwordHash: string;
}

export const UserCredentialSchema = SchemaFactory.createForClass(UserCredential);
