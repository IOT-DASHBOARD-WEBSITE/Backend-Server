import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../infras/entities/device.entity';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
} from '../delivery/request/create-device.request.dto';
import { DeviceDto } from '../delivery/response/device.response.dto';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<DeviceDto> {
    const createdDevice = new this.deviceModel(createDeviceDto);
    const saved = await createdDevice.save();
    return this.mapToDto(saved);
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ items: DeviceDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const [devices, total] = await Promise.all([
      this.deviceModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.deviceModel.countDocuments(),
    ]);
    return {
      items: devices.map((device) => this.mapToDto(device)),
      total,
    };
  }

  async findOne(id: string): Promise<DeviceDto> {
    const device = await this.deviceModel.findById(id).exec();
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return this.mapToDto(device);
  }

  async findByDeviceId(deviceId: string): Promise<DeviceDto | null> {
    const device = await this.deviceModel.findOne({ deviceId }).exec();
    return device ? this.mapToDto(device) : null;
  }

  async update(
    id: string,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceDto> {
    const device = await this.deviceModel.findByIdAndUpdate(
      id,
      updateDeviceDto,
      {
        new: true,
      },
    );
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return this.mapToDto(device);
  }

  async remove(id: string): Promise<void> {
    const result = await this.deviceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
  }

  async updateDeviceStatus(deviceId: string, isOnline: boolean): Promise<void> {
    await this.deviceModel.updateOne(
      { deviceId },
      { isOnline, lastSeen: new Date() },
    );
  }

  private mapToDto(device: DeviceDocument): DeviceDto {
    const mongoId = device._id as { toString(): string };
    return {
      id: mongoId.toString(),
      deviceId: device.deviceId,
      name: device.name,
      description: device.description,
      wifiSSID: device.wifiSSID,
      wifiPassword: device.wifiPassword,
      dataInterval: device.dataInterval,
      lastSeen: device.lastSeen,
      isOnline: device.isOnline,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }
}
