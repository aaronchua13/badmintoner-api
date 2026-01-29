import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CourtDocument = HydratedDocument<Court>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class Court {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ default: true })
  is_active: boolean;
}

export const CourtSchema = SchemaFactory.createForClass(Court);
