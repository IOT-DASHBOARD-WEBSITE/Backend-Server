import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ nullable: true })
  description?: string;

  @Prop({ nullable: true })
  wifiSSID?: string;

  @Prop({ nullable: true })
  wifiPassword?: string;

  @Prop({ default: 5000 })
  dataInterval: number; // milliseconds

  @Prop({ default: new Date() })
  lastSeen: Date;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ createdAt: -1 });
