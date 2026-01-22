import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

class UserPreferences {
  @Prop()
  theme: string;

  @Prop()
  notifications: boolean;
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: (doc, ret: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete ret.__v;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  image: string;

  @Prop({ default: 'admin' })
  role: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: UserPreferences })
  preferences: UserPreferences;

  @Prop()
  first_name: string;

  @Prop()
  last_name: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
