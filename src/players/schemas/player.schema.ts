import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerDocument = Player & Document;

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
export class Player {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  first_name: string;

  @Prop()
  last_name: string;

  @Prop({ default: true })
  is_active: boolean;

  // Add other player specific fields here if needed
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
