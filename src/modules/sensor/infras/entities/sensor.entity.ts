import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SensorDataDocument = SensorData & Document;

@Schema({ timestamps: true })
export class SensorData {
  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ nullable: true })
  light?: number;

  @Prop({ type: Date, required: true })
  timestamp: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const SensorDataSchema = SchemaFactory.createForClass(SensorData);
SensorDataSchema.index({ deviceId: 1, timestamp: -1 });
SensorDataSchema.index({ createdAt: -1 });
