import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ClubDocument = HydratedDocument<Club>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (doc, ret: Record<string, any>) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class Club {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ index: true })
  player_id: string;

  @Prop({ required: true })
  contact_person_name: string;

  @Prop()
  fb_link: string;

  @Prop()
  established_date: string;

  @Prop({ default: true })
  is_active: boolean;
}

export const ClubSchema = SchemaFactory.createForClass(Club);

ClubSchema.virtual('schedules', {
  ref: 'Schedule',
  localField: '_id',
  foreignField: 'club_id',
});
