import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ScheduleDocument = HydratedDocument<Schedule>;

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
export class Schedule {
  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  start_time: string;

  @Prop({ required: true })
  end_time: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Court', required: true })
  court_id: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Club',
    required: true,
    index: true,
  })
  club_id: string;

  @Prop({ default: true })
  is_active: boolean;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

ScheduleSchema.virtual('court', {
  ref: 'Court',
  localField: 'court_id',
  foreignField: '_id',
  justOne: true,
});
