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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (ret.firstName) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        ret.first_name = ret.firstName;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete ret.firstName;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (ret.lastName) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        ret.last_name = ret.lastName;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete ret.lastName;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (ret.isActive !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        ret.is_active = ret.isActive;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete ret.isActive;
      }
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

  @Prop({ default: 'user' })
  role: string;

  @Prop({ name: 'is_active', default: true })
  isActive: boolean;

  @Prop({ type: UserPreferences })
  preferences: UserPreferences;

  @Prop({ name: 'first_name' })
  firstName: string;

  @Prop({ name: 'last_name' })
  lastName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
