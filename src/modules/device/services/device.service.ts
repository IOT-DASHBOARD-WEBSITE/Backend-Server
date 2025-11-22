import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../infras/entities/device.entity';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
} from '../delivery/request/create-device.request.dto';
import { DeviceDto } from '../delivery/response/device.response.dto';
import { AdafruitFetcherService } from '../../notification/services/adafruit-fetcher.service';
import { AdafruitPublisherService } from '../../notification/services/adafruit-publisher.service';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @Inject(forwardRef(() => AdafruitFetcherService))
    private adafruitFetcher?: AdafruitFetcherService,
    @Inject(forwardRef(() => AdafruitPublisherService))
    private adafruitPublisher?: AdafruitPublisherService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<DeviceDto> {
    const createdDevice = new this.deviceModel(createDeviceDto);
    const saved = await createdDevice.save();
    const dto = this.mapToDto(saved);
    
    // Start fetching data for this device
    if (this.adafruitFetcher) {
      this.adafruitFetcher.startFetchingForDevice(dto.deviceId, dto.dataInterval);
    }
    
    return dto;
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
    const dto = this.mapToDto(device);
    
    // Restart fetching with new interval if dataInterval changed
    if (this.adafruitFetcher && updateDeviceDto.dataInterval !== undefined) {
      this.adafruitFetcher.startFetchingForDevice(dto.deviceId, dto.dataInterval);
    }

    // Publish dataInterval to Adafruit if changed (async, don't block response)
    if (this.adafruitPublisher && updateDeviceDto.dataInterval !== undefined) {
      console.log(`📤 Publishing dataInterval to Adafruit: ${dto.dataInterval}ms (${Math.floor(dto.dataInterval / 1000)}s)`);
      this.adafruitPublisher.publishSendInterval(dto.dataInterval).then((success) => {
        if (success) {
          console.log(`✅ dataInterval published to Adafruit successfully`);
        }
      }).catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to publish sendInterval to Adafruit: ${errorMessage}`, error);
      });
    }

    // Publish WiFi credentials to Adafruit if changed (async, don't block response)
    if (this.adafruitPublisher) {
      if (updateDeviceDto.wifiSSID !== undefined && updateDeviceDto.wifiSSID !== null && dto.wifiSSID) {
        console.log(`📤 Publishing WiFi SSID to Adafruit: ${dto.wifiSSID}`);
        this.adafruitPublisher.publishWifiSsid(dto.wifiSSID).then((success) => {
          if (success) {
            console.log(`✅ WiFi SSID published to Adafruit successfully`);
          }
        }).catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to publish WiFi SSID to Adafruit: ${errorMessage}`, error);
        });
      }
      if (updateDeviceDto.wifiPassword !== undefined && updateDeviceDto.wifiPassword !== null && dto.wifiPassword) {
        console.log(`📤 Publishing WiFi Password to Adafruit`);
        this.adafruitPublisher.publishWifiPassword(dto.wifiPassword).then((success) => {
          if (success) {
            console.log(`✅ WiFi Password published to Adafruit successfully`);
          }
        }).catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to publish WiFi Password to Adafruit: ${errorMessage}`, error);
        });
      }
    }
    
    return dto;
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
